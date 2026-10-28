package com.erp.account.modules.einvoice.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ConflictException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.enums.EinvoiceStatus;
import com.erp.account.modules.einvoice.config.EInvoiceRabbitMqProperties;
import com.erp.account.modules.einvoice.dto.*;
import com.erp.account.modules.einvoice.entity.CompanyEInvoiceConfig;
import com.erp.account.modules.einvoice.entity.EInvoiceAuditLog;
import com.erp.account.modules.einvoice.entity.EInvoiceJob;
import com.erp.account.modules.einvoice.entity.EInvoiceOutbox;
import com.erp.account.modules.einvoice.enums.EInvoiceAction;
import com.erp.account.modules.einvoice.enums.EInvoiceProviderType;
import com.erp.account.modules.einvoice.provider.EInvoiceProvider;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCancelResult;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceProviderResult;
import com.erp.account.modules.einvoice.repository.CompanyEInvoiceConfigRepository;
import com.erp.account.modules.einvoice.repository.EInvoiceAuditLogRepository;
import com.erp.account.modules.einvoice.repository.EInvoiceJobRepository;
import com.erp.account.modules.einvoice.repository.EInvoiceOutboxRepository;
import com.erp.account.modules.einvoice.service.EInvoiceCryptoService;
import com.erp.account.modules.einvoice.service.EInvoiceOutboxPublisher;
import com.erp.account.modules.einvoice.service.EInvoiceService;
import com.erp.account.modules.einvoice.service.EInvoiceValidator;
import com.erp.account.modules.einvoice.service.PayloadSanitizer;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.gst.repository.GstRegistrationRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EInvoiceServiceImpl implements EInvoiceService {

    private static final Pattern IDEMPOTENCY_KEY_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{8,64}$");

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final GstRegistrationRepository gstRegistrationRepository;
    private final EInvoiceJobRepository jobRepository;
    private final EInvoiceAuditLogRepository auditLogRepository;
    private final EInvoiceOutboxRepository outboxRepository;
    private final CompanyEInvoiceConfigRepository configRepository;
    private final EInvoiceValidator validator;
    private final EInvoiceOutboxPublisher outboxPublisher;
    private final EInvoiceRabbitMqProperties rabbitMqProperties;
    private final EInvoiceCryptoService cryptoService;
    private final List<EInvoiceProvider> providers;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public EInvoiceJobResponseDto requestGeneration(UUID invoiceId, EInvoiceGenerateRequestDto request, UUID companyId) {
        SalesInvoice invoice = salesInvoiceRepository.findById(invoiceId)
                .filter(inv -> inv.getCompanyId().equals(companyId) && !inv.getIsDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Sales invoice not found or not accessible"));

        // 1. Already generated check: Idempotent return if IRN is already generated
        if (invoice.getEinvoiceStatus() == EinvoiceStatus.GENERATED && StringUtils.hasText(invoice.getIrn())) {
            log.info("Invoice {} already has generated IRN {}. Returning current status.", invoice.getInvoiceNumber(), invoice.getIrn());
            return jobRepository.findFirstByInvoiceIdAndCompanyIdOrderByCreatedAtDesc(invoice.getId(), companyId)
                    .map(this::mapJobToDto)
                    .orElseGet(() -> EInvoiceJobResponseDto.builder()
                            .invoiceId(invoice.getId())
                            .companyId(companyId)
                            .status(EinvoiceStatus.GENERATED)
                            .irn(invoice.getIrn())
                            .ackNumber(invoice.getAckNo())
                            .ackDate(invoice.getAckDate())
                            .isMock(Boolean.TRUE.equals(invoice.getIsMockEinvoice()))
                            .build());
        }

        // 2. Active in-flight job check: prevent concurrent duplicate jobs for the same sales invoice
        var activeJob = jobRepository.findFirstByCompanyIdAndInvoiceIdAndStatusIn(
                companyId, invoice.getId(), List.of(EinvoiceStatus.QUEUED, EinvoiceStatus.PROCESSING)
        );
        if (activeJob.isPresent()) {
            log.info("Invoice {} already has an active e-Invoice job {}. Intercepting duplicate request.", invoice.getId(), activeJob.get().getId());
            return mapJobToDto(activeJob.get());
        }

        UUID reqGstId = request != null ? request.getGstRegistrationId() : null;
        GstRegistration supplierReg = validator.validateEligibilityAndResolveGstin(invoice, reqGstId);

        // Associate invoice with supplier GST registration if not already linked
        if (invoice.getGstRegistrationId() == null) {
            invoice.setGstRegistrationId(supplierReg.getId());
        }

        // Idempotency key handling: Validate client key format or generate deterministic stable key
        String idempotencyKey;
        if (request != null && StringUtils.hasText(request.getIdempotencyKey())) {
            String candidateKey = request.getIdempotencyKey().trim();
            if (!IDEMPOTENCY_KEY_PATTERN.matcher(candidateKey).matches()) {
                throw new BadRequestException("Invalid idempotencyKey format. Must be 8 to 64 alphanumeric characters, underscores, or hyphens.", "INVALID_IDEMPOTENCY_KEY");
            }
            idempotencyKey = candidateKey;
        } else {
            // Stable deterministic key: Scoped to tenant, invoice, and generation action (NO timestamps)
            idempotencyKey = "EINVOICE:GEN:" + companyId + ":" + invoice.getId();
        }

        // Check if job already exists with same idempotency key for this tenant
        var existingJobOpt = jobRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey);
        if (existingJobOpt.isPresent()) {
            EInvoiceJob existingJob = existingJobOpt.get();
            if (existingJob.getStatus() == EinvoiceStatus.QUEUED ||
                existingJob.getStatus() == EinvoiceStatus.PROCESSING ||
                existingJob.getStatus() == EinvoiceStatus.GENERATED ||
                existingJob.getStatus() == EinvoiceStatus.RECONCILIATION_REQUIRED) {
                log.info("Duplicate e-Invoice generation request intercepted by idempotency key: {}", idempotencyKey);
                return mapJobToDto(existingJob);
            } else if (existingJob.getStatus() == EinvoiceStatus.FAILED) {
                // Safe retry: Re-queue previously failed job rather than violating DB unique constraint
                log.info("Re-queueing previously failed e-Invoice job {} for idempotency key: {}", existingJob.getId(), idempotencyKey);
                existingJob.setStatus(EinvoiceStatus.QUEUED);
                existingJob.setRetryCount(0);
                existingJob.setFailureReason(null);
                existingJob = jobRepository.save(existingJob);

                invoice.setEinvoiceStatus(EinvoiceStatus.QUEUED);
                invoice.setEinvoiceFailureReason(null);
                salesInvoiceRepository.save(invoice);

                dispatchOutboxMessage(existingJob, invoice, supplierReg, idempotencyKey, companyId);
                return mapJobToDto(existingJob);
            }
        }

        // 1. Create Job record
        EInvoiceJob job = EInvoiceJob.builder()
                .companyId(companyId)
                .invoiceId(invoice.getId())
                .gstRegistrationId(supplierReg.getId())
                .status(EinvoiceStatus.QUEUED)
                .idempotencyKey(idempotencyKey)
                .retryCount(0)
                .maxRetries(3)
                .isMock(true) // Phase 1 is strictly mock-safe
                .build();
        job = jobRepository.save(job);

        // 2. Update Invoice e-Invoice status to QUEUED
        invoice.setEinvoiceStatus(EinvoiceStatus.QUEUED);
        invoice.setEinvoiceFailureReason(null);
        salesInvoiceRepository.save(invoice);

        // 3. Dispatch outbox
        dispatchOutboxMessage(job, invoice, supplierReg, idempotencyKey, companyId);

        return mapJobToDto(job);
    }

    private void dispatchOutboxMessage(EInvoiceJob job, SalesInvoice invoice, GstRegistration supplierReg, String idempotencyKey, UUID companyId) {
        EInvoiceQueueMessage queueMessage = EInvoiceQueueMessage.builder()
                .jobId(job.getId())
                .companyId(companyId)
                .invoiceId(invoice.getId())
                .gstRegistrationId(supplierReg.getId())
                .idempotencyKey(idempotencyKey)
                .attempt(1)
                .timestamp(LocalDateTime.now())
                .build();

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(queueMessage);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize e-Invoice queue message", e);
        }

        EInvoiceOutbox outbox = EInvoiceOutbox.builder()
                .jobId(job.getId())
                .companyId(companyId)
                .invoiceId(invoice.getId())
                .payload(payloadJson)
                .exchange(rabbitMqProperties.getExchange())
                .routingKey(rabbitMqProperties.getRoutingKey())
                .status("PENDING")
                .retryCount(0)
                .build();
        outbox = outboxRepository.save(outbox);

        auditLogRepository.save(EInvoiceAuditLog.builder()
                .jobId(job.getId())
                .companyId(companyId)
                .invoiceId(invoice.getId())
                .action(EInvoiceAction.QUEUED)
                .provider("MOCK")
                .requestPayload(PayloadSanitizer.sanitize(payloadJson))
                .build());

        outboxPublisher.publishImmediately(outbox, queueMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public EInvoiceStatusResponseDto getInvoiceStatus(UUID invoiceId, UUID companyId) {
        SalesInvoice invoice = salesInvoiceRepository.findById(invoiceId)
                .filter(inv -> inv.getCompanyId().equals(companyId) && !inv.getIsDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Sales invoice not found"));

        var latestJob = jobRepository.findFirstByInvoiceIdAndCompanyIdOrderByCreatedAtDesc(invoiceId, companyId);

        return EInvoiceStatusResponseDto.builder()
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .einvoiceStatus(invoice.getEinvoiceStatus() != null ? invoice.getEinvoiceStatus() : EinvoiceStatus.NOT_REQUESTED)
                .irn(invoice.getIrn())
                .ackNumber(invoice.getAckNo())
                .ackDate(invoice.getAckDate())
                .signedQrCode(invoice.getSignedQrCode())
                .isMockEinvoice(invoice.getIsMockEinvoice() != null && invoice.getIsMockEinvoice())
                .failureReason(invoice.getEinvoiceFailureReason())
                .latestJobId(latestJob.map(EInvoiceJob::getId).orElse(null))
                .lastUpdated(invoice.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EInvoiceJobResponseDto getJob(UUID jobId, UUID companyId) {
        EInvoiceJob job = jobRepository.findByIdAndCompanyId(jobId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("e-Invoice job not found"));
        return mapJobToDto(job);
    }

    @Override
    @Transactional
    public EInvoiceStatusResponseDto cancelEInvoice(UUID invoiceId, EInvoiceCancelRequestDto request, UUID companyId) {
        SalesInvoice invoice = salesInvoiceRepository.findById(invoiceId)
                .filter(inv -> inv.getCompanyId().equals(companyId) && !inv.getIsDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Sales invoice not found"));

        if (invoice.getEinvoiceStatus() != EinvoiceStatus.GENERATED || !StringUtils.hasText(invoice.getIrn())) {
            throw new BadRequestException("Invoice does not have a generated IRN to cancel", "INVALID_CANCEL_STATE");
        }

        CompanyEInvoiceConfig config = resolveConfig(companyId, invoice.getGstRegistrationId());
        EInvoiceProvider provider = resolveProvider(config != null ? config.getProviderName() : EInvoiceProviderType.MOCK);

        EInvoiceCancelResult cancelResult = provider.cancelIrn(
                config,
                invoice.getIrn(),
                request.getCancelReason(),
                request.getRemarks()
        );

        if (!cancelResult.isSuccess()) {
            throw new BadRequestException("e-Invoice cancellation failed: " + cancelResult.getErrorMessage(), "CANCELLATION_FAILED");
        }

        invoice.setEinvoiceStatus(EinvoiceStatus.CANCELLED);
        salesInvoiceRepository.save(invoice);

        auditLogRepository.save(EInvoiceAuditLog.builder()
                .companyId(companyId)
                .invoiceId(invoice.getId())
                .action(EInvoiceAction.CANCEL)
                .provider(provider.getProviderType().name())
                .requestPayload(PayloadSanitizer.sanitize(cancelResult.getRawRequest()))
                .responsePayload(PayloadSanitizer.sanitize(cancelResult.getRawResponse()))
                .executionDurationMs(cancelResult.getExecutionDurationMs())
                .build());

        return getInvoiceStatus(invoiceId, companyId);
    }

    @Override
    @Transactional
    public EInvoiceStatusResponseDto reconcileStatus(UUID invoiceId, UUID companyId) {
        SalesInvoice invoice = salesInvoiceRepository.findById(invoiceId)
                .filter(inv -> inv.getCompanyId().equals(companyId) && !inv.getIsDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Sales invoice not found"));

        if (!StringUtils.hasText(invoice.getIrn())) {
            throw new BadRequestException("Cannot reconcile invoice without an existing or pending IRN reference", "NO_IRN");
        }

        CompanyEInvoiceConfig config = resolveConfig(companyId, invoice.getGstRegistrationId());
        EInvoiceProvider provider = resolveProvider(config != null ? config.getProviderName() : EInvoiceProviderType.MOCK);

        EInvoiceProviderResult result = provider.getIrnDetails(config, invoice.getIrn());
        if (result.isSuccess()) {
            invoice.setEinvoiceStatus(EinvoiceStatus.GENERATED);
            invoice.setAckNo(result.getAckNumber());
            invoice.setAckDate(result.getAckDate());
            invoice.setSignedQrCode(result.getSignedQrCode());
            invoice.setSignedInvoice(result.getSignedInvoice());
            invoice.setEinvoiceFailureReason(null);
            salesInvoiceRepository.save(invoice);

            auditLogRepository.save(EInvoiceAuditLog.builder()
                    .companyId(companyId)
                    .invoiceId(invoice.getId())
                    .action(EInvoiceAction.RECONCILE)
                    .provider(provider.getProviderType().name())
                    .responsePayload(PayloadSanitizer.sanitize(result.getRawResponse()))
                    .executionDurationMs(result.getExecutionDurationMs())
                    .build());
        }

        return getInvoiceStatus(invoiceId, companyId);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyEInvoiceConfigDto getConfig(UUID companyId, UUID gstRegistrationId) {
        return configRepository.findByCompanyIdAndGstRegistrationId(companyId, gstRegistrationId)
                .map(this::mapConfigToDto)
                .orElse(CompanyEInvoiceConfigDto.builder()
                        .companyId(companyId)
                        .gstRegistrationId(gstRegistrationId)
                        .providerName(EInvoiceProviderType.MOCK)
                        .environment("SANDBOX")
                        .isActive(true)
                        .autoGenerateOnApproval(false)
                        .build());
    }

    @Override
    @Transactional
    public CompanyEInvoiceConfigDto saveConfig(CompanyEInvoiceConfigDto dto, UUID companyId) {
        if (dto.getGstRegistrationId() == null) {
            throw new BadRequestException("GST registration ID is mandatory", "MISSING_GST_REGISTRATION_ID");
        }

        // Validate tenant ownership of the GST registration
        gstRegistrationRepository.findById(dto.getGstRegistrationId())
                .filter(reg -> reg.getCompanyId().equals(companyId) && !Boolean.TRUE.equals(reg.getIsDeleted()))
                .orElseThrow(() -> new BadRequestException(
                        "GST registration not found or does not belong to company: " + dto.getGstRegistrationId(),
                        "INVALID_GST_REGISTRATION"
                ));

        EInvoiceProviderType provider = dto.getProviderName() != null ? dto.getProviderName() : EInvoiceProviderType.MOCK;

        // Security check: Live provider requires active master key configuration
        if (provider != EInvoiceProviderType.MOCK) {
            if (!cryptoService.isMasterKeyConfigured()) {
                throw new BadRequestException(
                        "Cannot configure live provider " + provider + ": Master encryption key is not configured. Supply 'erp.einvoice.security.master-key' first.",
                        "MISSING_MASTER_KEY"
                );
            }
            if (!StringUtils.hasText(dto.getClientId()) || !StringUtils.hasText(dto.getPortalUsername())) {
                throw new BadRequestException(
                        "Client ID and Portal Username are mandatory for live provider configuration.",
                        "MISSING_CREDENTIALS"
                );
            }
        }

        CompanyEInvoiceConfig config = configRepository.findByCompanyIdAndGstRegistrationId(companyId, dto.getGstRegistrationId())
                .orElse(CompanyEInvoiceConfig.builder()
                        .companyId(companyId)
                        .gstRegistrationId(dto.getGstRegistrationId())
                        .build());

        config.setProviderName(provider);
        config.setEnvironment(StringUtils.hasText(dto.getEnvironment()) ? dto.getEnvironment() : "SANDBOX");
        config.setClientId(dto.getClientId());
        config.setPortalUsername(dto.getPortalUsername());
        config.setAutoGenerateOnApproval(dto.isAutoGenerateOnApproval());
        config.setIsActive(dto.isActive());

        // Authenticated AES-256-GCM encryption of credentials at rest
        if (StringUtils.hasText(dto.getClientSecret())) {
            config.setEncryptedClientSecret(cryptoService.encrypt(dto.getClientSecret().trim()));
        }
        if (StringUtils.hasText(dto.getPortalPassword())) {
            config.setEncryptedPortalPassword(cryptoService.encrypt(dto.getPortalPassword().trim()));
        }

        config = configRepository.save(config);
        return mapConfigToDto(config);
    }

    private CompanyEInvoiceConfig resolveConfig(UUID companyId, UUID gstRegistrationId) {
        if (gstRegistrationId == null) {
            return null;
        }
        return configRepository.findByCompanyIdAndGstRegistrationIdAndIsActiveTrue(companyId, gstRegistrationId)
                .orElse(null);
    }

    private EInvoiceProvider resolveProvider(EInvoiceProviderType type) {
        if (type == null) {
            type = EInvoiceProviderType.MOCK;
        }
        final EInvoiceProviderType target = type;
        return providers.stream()
                .filter(p -> p.getProviderType() == target)
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "Unsupported or unregistered e-Invoice provider: " + target,
                        "UNKNOWN_PROVIDER"
                ));
    }

    private EInvoiceJobResponseDto mapJobToDto(EInvoiceJob job) {
        return EInvoiceJobResponseDto.builder()
                .jobId(job.getId())
                .invoiceId(job.getInvoiceId())
                .companyId(job.getCompanyId())
                .status(job.getStatus())
                .idempotencyKey(job.getIdempotencyKey())
                .irn(job.getIrn())
                .ackNumber(job.getAckNumber())
                .ackDate(job.getAckDate())
                .failureReason(job.getFailureReason())
                .isMock(job.getIsMock())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }

    private CompanyEInvoiceConfigDto mapConfigToDto(CompanyEInvoiceConfig cfg) {
        return CompanyEInvoiceConfigDto.builder()
                .id(cfg.getId())
                .companyId(cfg.getCompanyId())
                .gstRegistrationId(cfg.getGstRegistrationId())
                .providerName(cfg.getProviderName())
                .environment(cfg.getEnvironment())
                .clientId(cfg.getClientId())
                .portalUsername(cfg.getPortalUsername())
                .hasClientSecret(StringUtils.hasText(cfg.getEncryptedClientSecret()))
                .hasPortalPassword(StringUtils.hasText(cfg.getEncryptedPortalPassword()))
                .autoGenerateOnApproval(cfg.getAutoGenerateOnApproval())
                .isActive(cfg.getIsActive())
                .tokenExpiresAt(cfg.getTokenExpiresAt())
                .build();
    }
}
