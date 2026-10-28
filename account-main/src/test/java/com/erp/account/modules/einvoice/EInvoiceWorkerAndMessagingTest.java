package com.erp.account.modules.einvoice;

import com.erp.account.enums.EinvoiceStatus;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.einvoice.dto.EInvoiceQueueMessage;
import com.erp.account.modules.einvoice.entity.EInvoiceAuditLog;
import com.erp.account.modules.einvoice.entity.EInvoiceJob;
import com.erp.account.modules.einvoice.enums.EInvoiceAction;
import com.erp.account.modules.einvoice.provider.MockEInvoiceProvider;
import com.erp.account.modules.einvoice.repository.CompanyEInvoiceConfigRepository;
import com.erp.account.modules.einvoice.repository.EInvoiceAuditLogRepository;
import com.erp.account.modules.einvoice.repository.EInvoiceJobRepository;
import com.erp.account.modules.einvoice.service.EInvoicePayloadBuilder;
import com.erp.account.modules.einvoice.service.EInvoiceWorker;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.gst.repository.GstRegistrationRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EInvoiceWorkerAndMessagingTest {

    @Mock
    private EInvoiceJobRepository jobRepository;
    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;
    @Mock
    private GstRegistrationRepository gstRegistrationRepository;
    @Mock
    private CompanyEInvoiceConfigRepository configRepository;
    @Mock
    private EInvoiceAuditLogRepository auditLogRepository;

    private EInvoicePayloadBuilder payloadBuilder;
    private MockEInvoiceProvider mockProvider;
    private EInvoiceWorker worker;
    private ObjectMapper objectMapper;

    private UUID companyId;
    private UUID invoiceId;
    private UUID jobId;
    private UUID gstRegId;
    private EInvoiceJob queuedJob;
    private SalesInvoice salesInvoice;
    private GstRegistration gstRegistration;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mockProvider = new MockEInvoiceProvider(objectMapper);
        payloadBuilder = new EInvoicePayloadBuilder();

        worker = new EInvoiceWorker(
                jobRepository,
                salesInvoiceRepository,
                gstRegistrationRepository,
                configRepository,
                auditLogRepository,
                payloadBuilder,
                List.of(mockProvider)
        );

        companyId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();
        jobId = UUID.randomUUID();
        gstRegId = UUID.randomUUID();

        gstRegistration = GstRegistration.builder()
                .id(gstRegId)
                .companyId(companyId)
                .gstin("27AAAAA0000A1Z5")
                .legalName("Acme Ltd")
                .isDefault(true)
                .build();
        gstRegistration.setIsDeleted(false);

        Customer customer = Customer.builder()
                .id(UUID.randomUUID())
                .customerName("Buyer Corp")
                .gstin("29BBBBB1111B1Z2")
                .build();

        SalesInvoiceItem item = SalesInvoiceItem.builder()
                .id(UUID.randomUUID())
                .itemName("Server Hardware")
                .hsnSacMaster(com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster.builder().code("84713010").build())
                .quantity(new BigDecimal("1"))
                .unitPrice(new BigDecimal("50000.00"))
                .taxableAmount(new BigDecimal("50000.00"))
                .igstAmount(new BigDecimal("9000.00"))
                .totalAmount(new BigDecimal("59000.00"))
                .build();

        salesInvoice = SalesInvoice.builder()
                .id(invoiceId)
                .companyId(companyId)
                .invoiceNumber("INV-1001")
                .invoiceDate(LocalDate.now())
                .status(InvoiceStatus.APPROVED)
                .einvoiceStatus(EinvoiceStatus.QUEUED)
                .customer(customer)
                .subtotal(new BigDecimal("50000.00"))
                .taxAmount(new BigDecimal("9000.00"))
                .totalAmount(new BigDecimal("59000.00"))
                .salesInvoiceItems(new HashSet<>(Set.of(item)))
                .build();
        salesInvoice.setIsDeleted(false);

        queuedJob = EInvoiceJob.builder()
                .id(jobId)
                .companyId(companyId)
                .invoiceId(invoiceId)
                .gstRegistrationId(gstRegId)
                .status(EinvoiceStatus.QUEUED)
                .idempotencyKey("KEY-1001")
                .retryCount(0)
                .maxRetries(3)
                .isMock(true)
                .build();
    }

    @Test
    @DisplayName("1. Asynchronous worker processes RabbitMQ message, generates MOCK IRN and updates both job and invoice")
    void testWorkerProcessesQueueMessageSuccessfully() {
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(queuedJob));
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(salesInvoice));
        when(gstRegistrationRepository.findById(gstRegId)).thenReturn(Optional.of(gstRegistration));
        when(configRepository.findByCompanyIdAndGstRegistrationIdAndIsActiveTrue(companyId, gstRegId)).thenReturn(Optional.empty());

        EInvoiceQueueMessage msg = EInvoiceQueueMessage.builder()
                .jobId(jobId)
                .companyId(companyId)
                .invoiceId(invoiceId)
                .gstRegistrationId(gstRegId)
                .idempotencyKey("KEY-1001")
                .attempt(1)
                .timestamp(LocalDateTime.now())
                .build();

        worker.processEInvoiceGeneration(msg);

        // Verify Job was updated to GENERATED
        assertEquals(EinvoiceStatus.GENERATED, queuedJob.getStatus());
        assertNotNull(queuedJob.getIrn());
        assertTrue(queuedJob.getIrn().startsWith("MOCK-IRN-"));
        assertNotNull(queuedJob.getAckNumber());
        assertTrue(queuedJob.getAckNumber().startsWith("MOCK-ACK-"));
        assertTrue(queuedJob.getSignedQrCode().startsWith("MOCK-SIGNED-QR-JWT"));

        // Verify Invoice was updated to GENERATED
        assertEquals(EinvoiceStatus.GENERATED, salesInvoice.getEinvoiceStatus());
        assertEquals(queuedJob.getIrn(), salesInvoice.getIrn());
        assertEquals(queuedJob.getAckNumber(), salesInvoice.getAckNo());
        assertTrue(salesInvoice.getIsMockEinvoice());

        verify(jobRepository, atLeastOnce()).save(queuedJob);
        verify(salesInvoiceRepository, atLeastOnce()).save(salesInvoice);
        verify(auditLogRepository).save(any(EInvoiceAuditLog.class));
    }

    @Test
    @DisplayName("2. Idempotent duplicate delivery: Skips reprocessing when job is already GENERATED")
    void testWorkerDuplicateDelivery_SkipsWhenAlreadyGenerated() {
        queuedJob.setStatus(EinvoiceStatus.GENERATED);
        queuedJob.setIrn("MOCK-IRN-EXISTING");

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(queuedJob));

        EInvoiceQueueMessage msg = EInvoiceQueueMessage.builder()
                .jobId(jobId)
                .companyId(companyId)
                .invoiceId(invoiceId)
                .gstRegistrationId(gstRegId)
                .build();

        worker.processEInvoiceGeneration(msg);

        verify(salesInvoiceRepository, never()).findById(any());
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("3. Tenant isolation in background worker: Rejects message if tenant does not match job entity")
    void testWorkerTenantIsolation_AbortsOnTenantMismatch() {
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(queuedJob));

        UUID maliciousCompanyId = UUID.randomUUID();
        EInvoiceQueueMessage spoofedMsg = EInvoiceQueueMessage.builder()
                .jobId(jobId)
                .companyId(maliciousCompanyId)
                .invoiceId(invoiceId)
                .gstRegistrationId(gstRegId)
                .build();

        worker.processEInvoiceGeneration(spoofedMsg);

        assertEquals(EinvoiceStatus.FAILED, queuedJob.getStatus());
        assertEquals("Tenant security violation", queuedJob.getFailureReason());
        verify(salesInvoiceRepository, never()).findById(any());
    }

    @Test
    @DisplayName("4. Ambiguous timeout handling: Sets RECONCILIATION_REQUIRED instead of blindly retrying")
    void testWorkerTimeoutAmbiguous_SetsReconciliationRequired() {
        salesInvoice.setInvoiceNumber("SIMULATE_TIMEOUT");

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(queuedJob));
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(salesInvoice));
        when(gstRegistrationRepository.findById(gstRegId)).thenReturn(Optional.of(gstRegistration));

        EInvoiceQueueMessage msg = EInvoiceQueueMessage.builder()
                .jobId(jobId)
                .companyId(companyId)
                .invoiceId(invoiceId)
                .gstRegistrationId(gstRegId)
                .build();

        worker.processEInvoiceGeneration(msg);

        assertEquals(EinvoiceStatus.RECONCILIATION_REQUIRED, queuedJob.getStatus());
        assertEquals(EinvoiceStatus.RECONCILIATION_REQUIRED, salesInvoice.getEinvoiceStatus());
        verify(auditLogRepository).save(any(EInvoiceAuditLog.class));
    }

    @Test
    @DisplayName("5. Duplicate submission error (2150): Automatically queries details and syncs existing IRN")
    void testWorkerDuplicateError2150_AutomaticallyReconciles() {
        salesInvoice.setInvoiceNumber("SIMULATE_DUPLICATE");

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(queuedJob));
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(salesInvoice));
        when(gstRegistrationRepository.findById(gstRegId)).thenReturn(Optional.of(gstRegistration));

        EInvoiceQueueMessage msg = EInvoiceQueueMessage.builder()
                .jobId(jobId)
                .companyId(companyId)
                .invoiceId(invoiceId)
                .gstRegistrationId(gstRegId)
                .build();

        worker.processEInvoiceGeneration(msg);

        // Should recover and set GENERATED after querying details
        assertEquals(EinvoiceStatus.GENERATED, queuedJob.getStatus());
        assertEquals(EinvoiceStatus.GENERATED, salesInvoice.getEinvoiceStatus());
        assertEquals("MOCK-ACK-RECONCILED", salesInvoice.getAckNo());
    }

    @Test
    @DisplayName("6. Invoice already generated with IRN: Synchronizes job and exits safely without provider invocation")
    void testWorker_InvoiceAlreadyHasIrn_SynchronizesJobAndExits() {
        salesInvoice.setEinvoiceStatus(EinvoiceStatus.GENERATED);
        salesInvoice.setIrn("MOCK-IRN-EXISTING-ALREADY");
        salesInvoice.setAckNo("MOCK-ACK-9999");
        salesInvoice.setAckDate(LocalDateTime.now());
        salesInvoice.setSignedQrCode("MOCK-QR-9999");
        salesInvoice.setSignedInvoice("MOCK-INVOICE-9999");

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(queuedJob));
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(salesInvoice));

        EInvoiceQueueMessage msg = EInvoiceQueueMessage.builder()
                .jobId(jobId)
                .companyId(companyId)
                .invoiceId(invoiceId)
                .gstRegistrationId(gstRegId)
                .build();

        worker.processEInvoiceGeneration(msg);

        assertEquals(EinvoiceStatus.GENERATED, queuedJob.getStatus());
        assertEquals("MOCK-IRN-EXISTING-ALREADY", queuedJob.getIrn());
        assertEquals("MOCK-ACK-9999", queuedJob.getAckNumber());
        verify(jobRepository).save(queuedJob);
        // Provider should never have been invoked because audit log is never created
        verify(auditLogRepository, never()).save(any());
    }
}
