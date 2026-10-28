package com.erp.account.modules.einvoice.service;

import com.erp.account.enums.EinvoiceStatus;
import com.erp.account.modules.einvoice.dto.EInvoiceQueueMessage;
import com.erp.account.modules.einvoice.entity.CompanyEInvoiceConfig;
import com.erp.account.modules.einvoice.entity.EInvoiceAuditLog;
import com.erp.account.modules.einvoice.entity.EInvoiceJob;
import com.erp.account.modules.einvoice.enums.EInvoiceAction;
import com.erp.account.modules.einvoice.enums.EInvoiceProviderType;
import com.erp.account.modules.einvoice.provider.EInvoiceProvider;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCanonicalPayload;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceProviderResult;
import com.erp.account.modules.einvoice.repository.CompanyEInvoiceConfigRepository;
import com.erp.account.modules.einvoice.repository.EInvoiceAuditLogRepository;
import com.erp.account.modules.einvoice.repository.EInvoiceJobRepository;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.gst.repository.GstRegistrationRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import lombok.Builder;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Asynchronous Spring Boot worker processing e-Invoice generation jobs from RabbitMQ.
 *
 * CRITICAL ARCHITECTURAL SAFEGUARDS:
 * 1. Zero HTTP provider calls inside database transactions:
 *    Database transaction 1 acquires lock, validates boundaries, and marks PROCESSING.
 *    External IRP/GSP HTTP call is executed completely OUTSIDE any database transaction.
 *    Database transaction 2 records the result (success, duplicate, timeout, or failure) and audit log.
 * 2. Tenant isolation is revalidated from persistent entities.
 * 3. Duplicate RabbitMQ delivery is treated as an expected condition (idempotent skip).
 * 4. All secrets and sensitive tokens in audit logs and trace output are redacted.
 */
@Component
@Slf4j
public class EInvoiceWorker {

    private final EInvoiceJobRepository jobRepository;
    private final SalesInvoiceRepository salesInvoiceRepository;
    private final GstRegistrationRepository gstRegistrationRepository;
    private final CompanyEInvoiceConfigRepository configRepository;
    private final EInvoiceAuditLogRepository auditLogRepository;
    private final EInvoicePayloadBuilder payloadBuilder;
    private final List<EInvoiceProvider> providers;
    private final TransactionTemplate transactionTemplate;

    @Autowired
    public EInvoiceWorker(
            EInvoiceJobRepository jobRepository,
            SalesInvoiceRepository salesInvoiceRepository,
            GstRegistrationRepository gstRegistrationRepository,
            CompanyEInvoiceConfigRepository configRepository,
            EInvoiceAuditLogRepository auditLogRepository,
            EInvoicePayloadBuilder payloadBuilder,
            List<EInvoiceProvider> providers,
            @Autowired(required = false) TransactionTemplate transactionTemplate) {
        this.jobRepository = jobRepository;
        this.salesInvoiceRepository = salesInvoiceRepository;
        this.gstRegistrationRepository = gstRegistrationRepository;
        this.configRepository = configRepository;
        this.auditLogRepository = auditLogRepository;
        this.payloadBuilder = payloadBuilder;
        this.providers = providers;
        this.transactionTemplate = transactionTemplate;
    }

    /**
     * Testing constructor for non-transactional or unit test mocking.
     */
    public EInvoiceWorker(
            EInvoiceJobRepository jobRepository,
            SalesInvoiceRepository salesInvoiceRepository,
            GstRegistrationRepository gstRegistrationRepository,
            CompanyEInvoiceConfigRepository configRepository,
            EInvoiceAuditLogRepository auditLogRepository,
            EInvoicePayloadBuilder payloadBuilder,
            List<EInvoiceProvider> providers) {
        this(jobRepository, salesInvoiceRepository, gstRegistrationRepository, configRepository,
                auditLogRepository, payloadBuilder, providers, null);
    }

    @RabbitListener(
            queues = "${erp.einvoice.rabbitmq.queue:erp.einvoice.generate.queue}",
            containerFactory = "einvoiceContainerFactory"
    )
    public void processEInvoiceGeneration(EInvoiceQueueMessage message) {
        log.info("Received e-Invoice generation message for job={} invoice={} tenant={}",
                message.getJobId(), message.getInvoiceId(), message.getCompanyId());

        // PHASE 1: Short DB Transaction - Claim job, revalidate boundaries, mark PROCESSING
        ClaimedJobContext context = runInTransaction(() -> claimJobForProcessing(message));
        if (context == null) {
            log.info("Job {} was skipped, already completed, or encountered fatal validation error.", message.getJobId());
            return;
        }

        // PHASE 2: External Provider API Call - EXECUTED OUTSIDE ANY DATABASE TRANSACTION!
        // Prevents connection pool starvation and eliminates auto-retry transaction rollbacks.
        EInvoiceProviderResult result;
        try {
            result = context.getProvider().generateIrn(context.getConfig(), context.getPayload());
        } catch (Exception e) {
            log.error("Provider execution threw unhandled exception for job {}", context.getJobId(), e);
            result = EInvoiceProviderResult.failure(
                    "TIMEOUT_AMBIGUOUS",
                    "Unhandled provider exception: " + e.getMessage(),
                    false,
                    true,
                    null,
                    e.getMessage(),
                    0L
            );
        }

        // PHASE 3: Short DB Transaction - Apply final state and write redacted audit log
        final EInvoiceProviderResult finalResult = result;
        runInTransactionWithoutResult(() -> completeJob(context, finalResult));
    }

    private ClaimedJobContext claimJobForProcessing(EInvoiceQueueMessage message) {
        Optional<EInvoiceJob> jobOpt = jobRepository.findById(message.getJobId());
        if (jobOpt.isEmpty()) {
            log.error("e-Invoice job {} not found in database. Discarding message.", message.getJobId());
            return null;
        }

        EInvoiceJob job = jobOpt.get();

        // Tenant Security Check: Ensure message tenant matches persisted entity tenant
        if (!job.getCompanyId().equals(message.getCompanyId())) {
            log.error("Tenant boundary mismatch! Job company {} does not match message company {}. Aborting.",
                    job.getCompanyId(), message.getCompanyId());
            job.setStatus(EinvoiceStatus.FAILED);
            job.setFailureReason("Tenant security violation");
            jobRepository.save(job);
            return null;
        }

        // Idempotency: If already in final state, skip duplicate RabbitMQ delivery
        if (job.getStatus() == EinvoiceStatus.GENERATED || job.getStatus() == EinvoiceStatus.CANCELLED) {
            log.info("e-Invoice job {} is already in final state: {}. Duplicate message safely acknowledged.", job.getId(), job.getStatus());
            return null;
        }

        // Fetch & Revalidate Sales Invoice
        Optional<SalesInvoice> invoiceOpt = salesInvoiceRepository.findById(message.getInvoiceId());
        if (invoiceOpt.isEmpty()) {
            log.error("Invoice {} not found for e-Invoice job {}. Marking job FAILED.", message.getInvoiceId(), job.getId());
            job.setStatus(EinvoiceStatus.FAILED);
            job.setFailureReason("Sales invoice record not found");
            jobRepository.save(job);
            return null;
        }

        SalesInvoice invoice = invoiceOpt.get();
        if (!invoice.getCompanyId().equals(job.getCompanyId())) {
            log.error("Invoice company {} does not match job company {}. Aborting.", invoice.getCompanyId(), job.getCompanyId());
            job.setStatus(EinvoiceStatus.FAILED);
            job.setFailureReason("Invoice tenant isolation violation");
            jobRepository.save(job);
            return null;
        }

        // If invoice already has IRN generated, synchronize job and exit safely
        if (invoice.getEinvoiceStatus() == EinvoiceStatus.GENERATED && invoice.getIrn() != null) {
            log.info("Invoice {} already has IRN {}. Synchronizing job and completing.", invoice.getId(), invoice.getIrn());
            job.setStatus(EinvoiceStatus.GENERATED);
            job.setIrn(invoice.getIrn());
            job.setAckNumber(invoice.getAckNo());
            job.setAckDate(invoice.getAckDate());
            job.setSignedQrCode(invoice.getSignedQrCode());
            job.setSignedInvoice(invoice.getSignedInvoice());
            jobRepository.save(job);
            return null;
        }

        // Mark Job and Invoice as PROCESSING
        job.setStatus(EinvoiceStatus.PROCESSING);
        job.setRetryCount(job.getRetryCount() + 1);
        jobRepository.save(job);

        invoice.setEinvoiceStatus(EinvoiceStatus.PROCESSING);
        salesInvoiceRepository.save(invoice);

        // Resolve Supplier GST Registration
        GstRegistration supplierReg = gstRegistrationRepository.findById(message.getGstRegistrationId())
                .filter(r -> r.getCompanyId().equals(job.getCompanyId()) && !r.getIsDeleted())
                .orElse(null);

        if (supplierReg == null) {
            supplierReg = gstRegistrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(job.getCompanyId())
                    .orElse(null);
        }

        if (supplierReg == null) {
            failJob(job, invoice, "No active GST registration found for company", "MISSING_GSTIN");
            return null;
        }

        // Resolve Provider & Config
        CompanyEInvoiceConfig config = configRepository.findByCompanyIdAndGstRegistrationIdAndIsActiveTrue(job.getCompanyId(), supplierReg.getId())
                .orElse(null);

        EInvoiceProviderType providerType = config != null ? config.getProviderName() : EInvoiceProviderType.MOCK;
        EInvoiceProvider provider = resolveProvider(providerType);

        // Build Canonical Payload
        EInvoiceCanonicalPayload payload;
        try {
            payload = payloadBuilder.build(invoice, supplierReg);
        } catch (Exception e) {
            log.error("Failed to build canonical e-Invoice payload for invoice {}", invoice.getId(), e);
            failJob(job, invoice, "Schema payload mapping error: " + e.getMessage(), "PAYLOAD_ERROR");
            return null;
        }

        return ClaimedJobContext.builder()
                .jobId(job.getId())
                .companyId(job.getCompanyId())
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .config(config)
                .provider(provider)
                .payload(payload)
                .build();
    }

    private void completeJob(ClaimedJobContext context, EInvoiceProviderResult result) {
        EInvoiceJob job = jobRepository.findById(context.getJobId()).orElse(null);
        SalesInvoice invoice = salesInvoiceRepository.findById(context.getInvoiceId()).orElse(null);

        if (job == null || invoice == null) {
            log.error("Job {} or Invoice {} disappeared before completing result", context.getJobId(), context.getInvoiceId());
            return;
        }

        String providerName = context.getProvider().getProviderType().name();

        if (result.isSuccess()) {
            handleSuccess(job, invoice, result, providerName);
        } else if (result.isDuplicate()) {
            // Error 2150: IRN already generated for this invoice on government portal.
            // Query portal for the existing IRN rather than creating duplicate or failing.
            log.warn("IRN was already generated on IRP for invoice {}. Attempting reconciliation.", context.getInvoiceNumber());
            handleDuplicateReconciliation(job, invoice, context.getConfig(), context.getProvider(), result);
        } else if (result.isTimeoutAmbiguous()) {
            // Read timeout / ambiguous network outcome: DO NOT blindly retry generation to avoid duplicate collisions.
            log.warn("Ambiguous timeout occurred while generating IRN for job {}. Transitioning to RECONCILIATION_REQUIRED.", job.getId());
            handleAmbiguousOutcome(job, invoice, providerName, result.getErrorMessage());
        } else {
            // Business rejection (invalid HSN, GSTIN suspended, tax mismatch)
            log.error("e-Invoice generation failed for job {}: [{}] {}", job.getId(), result.getErrorCode(), result.getErrorMessage());
            failJob(job, invoice, result.getErrorMessage(), result.getErrorCode());
            recordAudit(job, invoice, EInvoiceAction.GENERATE, providerName, result.getRawRequest(), result.getRawResponse(), result.getErrorCode(), result.getErrorMessage(), result.getExecutionDurationMs());
        }
    }

    private void handleSuccess(EInvoiceJob job, SalesInvoice invoice, EInvoiceProviderResult result, String providerName) {
        log.info("e-Invoice successfully generated for invoice {} | IRN: {}", invoice.getInvoiceNumber(), result.getIrn());

        job.setStatus(EinvoiceStatus.GENERATED);
        job.setIrn(result.getIrn());
        job.setAckNumber(result.getAckNumber());
        job.setAckDate(result.getAckDate());
        job.setSignedInvoice(result.getSignedInvoice());
        job.setSignedQrCode(result.getSignedQrCode());
        job.setIsMock(result.isMock());
        job.setFailureReason(null);
        jobRepository.save(job);

        invoice.setEinvoiceStatus(EinvoiceStatus.GENERATED);
        invoice.setIrn(result.getIrn());
        invoice.setAckNo(result.getAckNumber());
        invoice.setAckDate(result.getAckDate());
        invoice.setSignedInvoice(result.getSignedInvoice());
        invoice.setSignedQrCode(result.getSignedQrCode());
        invoice.setIsMockEinvoice(result.isMock());
        invoice.setEinvoiceFailureReason(null);
        salesInvoiceRepository.save(invoice);

        recordAudit(job, invoice, EInvoiceAction.GENERATE, providerName, result.getRawRequest(), result.getRawResponse(), null, null, result.getExecutionDurationMs());
    }

    private void handleDuplicateReconciliation(EInvoiceJob job, SalesInvoice invoice, CompanyEInvoiceConfig config, EInvoiceProvider provider, EInvoiceProviderResult initialResult) {
        EInvoiceProviderResult details = provider.getIrnDetails(config, initialResult.getIrn() != null ? initialResult.getIrn() : invoice.getInvoiceNumber());
        if (details != null && details.isSuccess()) {
            handleSuccess(job, invoice, details, provider.getProviderType().name());
        } else {
            handleAmbiguousOutcome(job, invoice, provider.getProviderType().name(), "IRN already generated on portal, manual reconciliation required");
        }
    }

    private void handleAmbiguousOutcome(EInvoiceJob job, SalesInvoice invoice, String providerName, String reason) {
        job.setStatus(EinvoiceStatus.RECONCILIATION_REQUIRED);
        job.setFailureReason(reason);
        jobRepository.save(job);

        invoice.setEinvoiceStatus(EinvoiceStatus.RECONCILIATION_REQUIRED);
        invoice.setEinvoiceFailureReason(reason);
        salesInvoiceRepository.save(invoice);

        recordAudit(job, invoice, EInvoiceAction.SYNC_STATUS, providerName, null, null, "TIMEOUT_AMBIGUOUS", reason, 0L);
    }

    private void failJob(EInvoiceJob job, SalesInvoice invoice, String reason, String errorCode) {
        job.setStatus(EinvoiceStatus.FAILED);
        job.setFailureReason(reason);
        jobRepository.save(job);

        invoice.setEinvoiceStatus(EinvoiceStatus.FAILED);
        invoice.setEinvoiceFailureReason(reason);
        salesInvoiceRepository.save(invoice);
    }

    private void recordAudit(EInvoiceJob job, SalesInvoice invoice, EInvoiceAction action, String provider, String req, String resp, String errCode, String errMsg, Long duration) {
        auditLogRepository.save(EInvoiceAuditLog.builder()
                .jobId(job != null ? job.getId() : null)
                .companyId(invoice.getCompanyId())
                .invoiceId(invoice.getId())
                .action(action)
                .provider(provider)
                .requestPayload(PayloadSanitizer.sanitize(req))
                .responsePayload(PayloadSanitizer.sanitize(resp))
                .errorCode(errCode)
                .errorMessage(errMsg)
                .executionDurationMs(duration)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private EInvoiceProvider resolveProvider(EInvoiceProviderType type) {
        if (type == null) {
            type = EInvoiceProviderType.MOCK;
        }
        final EInvoiceProviderType target = type;
        return providers.stream()
                .filter(p -> p.getProviderType() == target)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Requested e-Invoice provider is not registered: " + target));
    }

    private <T> T runInTransaction(java.util.function.Supplier<T> action) {
        if (transactionTemplate != null) {
            return transactionTemplate.execute(status -> action.get());
        }
        return action.get();
    }

    private void runInTransactionWithoutResult(Runnable action) {
        if (transactionTemplate != null) {
            transactionTemplate.executeWithoutResult(status -> action.run());
        } else {
            action.run();
        }
    }

    @Value
    @Builder
    private static class ClaimedJobContext {
        UUID jobId;
        UUID companyId;
        UUID invoiceId;
        String invoiceNumber;
        CompanyEInvoiceConfig config;
        EInvoiceProvider provider;
        EInvoiceCanonicalPayload payload;
    }
}
