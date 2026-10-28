package com.erp.account.modules.einvoice;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ConflictException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.enums.EinvoiceStatus;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.einvoice.config.EInvoiceRabbitMqProperties;
import com.erp.account.modules.einvoice.dto.EInvoiceCancelRequestDto;
import com.erp.account.modules.einvoice.dto.EInvoiceGenerateRequestDto;
import com.erp.account.modules.einvoice.dto.EInvoiceJobResponseDto;
import com.erp.account.modules.einvoice.dto.EInvoiceStatusResponseDto;
import com.erp.account.modules.einvoice.entity.EInvoiceAuditLog;
import com.erp.account.modules.einvoice.entity.EInvoiceJob;
import com.erp.account.modules.einvoice.entity.EInvoiceOutbox;
import com.erp.account.modules.einvoice.enums.EInvoiceProviderType;
import com.erp.account.modules.einvoice.provider.EInvoiceProvider;
import com.erp.account.modules.einvoice.provider.MockEInvoiceProvider;
import com.erp.account.modules.einvoice.repository.CompanyEInvoiceConfigRepository;
import com.erp.account.modules.einvoice.repository.EInvoiceAuditLogRepository;
import com.erp.account.modules.einvoice.repository.EInvoiceJobRepository;
import com.erp.account.modules.einvoice.repository.EInvoiceOutboxRepository;
import com.erp.account.modules.einvoice.service.EInvoiceCryptoService;
import com.erp.account.modules.einvoice.service.EInvoiceOutboxPublisher;
import com.erp.account.modules.einvoice.service.EInvoiceValidator;
import com.erp.account.modules.einvoice.service.impl.EInvoiceServiceImpl;
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
class EInvoiceWorkflowAndValidationTest {

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;
    @Mock
    private GstRegistrationRepository gstRegistrationRepository;
    @Mock
    private EInvoiceJobRepository jobRepository;
    @Mock
    private EInvoiceAuditLogRepository auditLogRepository;
    @Mock
    private EInvoiceOutboxRepository outboxRepository;
    @Mock
    private CompanyEInvoiceConfigRepository configRepository;
    @Mock
    private EInvoiceOutboxPublisher outboxPublisher;

    private EInvoiceValidator validator;
    private EInvoiceServiceImpl einvoiceService;
    private MockEInvoiceProvider mockProvider;
    private ObjectMapper objectMapper;
    private EInvoiceRabbitMqProperties properties;

    private UUID tenantCompanyId;
    private UUID otherCompanyId;
    private UUID invoiceId;
    private UUID gstRegId;
    private SalesInvoice validInvoice;
    private GstRegistration supplierReg;
    private Customer validCustomer;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mockProvider = new MockEInvoiceProvider(objectMapper);
        properties = new EInvoiceRabbitMqProperties();
        validator = new EInvoiceValidator(gstRegistrationRepository);
        EInvoiceCryptoService cryptoService = new EInvoiceCryptoService("01234567890123456789012345678901");

        einvoiceService = new EInvoiceServiceImpl(
                salesInvoiceRepository,
                gstRegistrationRepository,
                jobRepository,
                auditLogRepository,
                outboxRepository,
                configRepository,
                validator,
                outboxPublisher,
                properties,
                cryptoService,
                List.of(mockProvider),
                objectMapper
        );


        tenantCompanyId = UUID.randomUUID();
        otherCompanyId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();
        gstRegId = UUID.randomUUID();

        supplierReg = GstRegistration.builder()
                .id(gstRegId)
                .companyId(tenantCompanyId)
                .gstin("27AAAAA0000A1Z5")
                .legalName("Acme ERP India Ltd")
                .tradeName("Acme Corp")
                .isDefault(true)
                .build();
        supplierReg.setIsDeleted(false);

        validCustomer = Customer.builder()
                .id(UUID.randomUUID())
                .customerName("Retail Partner Pvt Ltd")
                .gstin("29BBBBB1111B1Z2")
                .build();

        SalesInvoiceItem item = SalesInvoiceItem.builder()
                .id(UUID.randomUUID())
                .itemName("Laptop")
                .hsnSacMaster(com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster.builder().code("84713010").build())
                .quantity(new BigDecimal("2"))
                .unitPrice(new BigDecimal("50000.00"))
                .taxableAmount(new BigDecimal("100000.00"))
                .igstAmount(new BigDecimal("18000.00"))
                .totalAmount(new BigDecimal("118000.00"))
                .build();

        validInvoice = SalesInvoice.builder()
                .id(invoiceId)
                .companyId(tenantCompanyId)
                .invoiceNumber("INV-2026-001")
                .invoiceDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .status(InvoiceStatus.APPROVED)
                .einvoiceStatus(EinvoiceStatus.NOT_REQUESTED)
                .customer(validCustomer)
                .subtotal(new BigDecimal("100000.00"))
                .taxAmount(new BigDecimal("18000.00"))
                .totalAmount(new BigDecimal("118000.00"))
                .salesInvoiceItems(new HashSet<>(Set.of(item)))
                .build();
        validInvoice.setIsDeleted(false);
    }

    @Test
    @DisplayName("1. Successfully enqueues e-Invoice generation job and creates outbox record")
    void testRequestGeneration_Success() {
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));
        when(gstRegistrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(tenantCompanyId))
                .thenReturn(Optional.of(supplierReg));
        when(jobRepository.findByCompanyIdAndIdempotencyKey(eq(tenantCompanyId), any())).thenReturn(Optional.empty());

        when(jobRepository.save(any(EInvoiceJob.class))).thenAnswer(invocation -> {
            EInvoiceJob job = invocation.getArgument(0);
            job.setId(UUID.randomUUID());
            return job;
        });

        when(outboxRepository.save(any(EInvoiceOutbox.class))).thenAnswer(invocation -> {
            EInvoiceOutbox outbox = invocation.getArgument(0);
            outbox.setId(UUID.randomUUID());
            return outbox;
        });

        EInvoiceGenerateRequestDto req = EInvoiceGenerateRequestDto.builder()
                .idempotencyKey("KEY-12345")
                .build();

        EInvoiceJobResponseDto response = einvoiceService.requestGeneration(invoiceId, req, tenantCompanyId);

        assertNotNull(response);
        assertEquals(EinvoiceStatus.QUEUED, response.getStatus());
        assertEquals("KEY-12345", response.getIdempotencyKey());
        assertTrue(response.isMock());

        verify(jobRepository).save(any(EInvoiceJob.class));
        verify(salesInvoiceRepository).save(validInvoice);
        verify(outboxRepository).save(any(EInvoiceOutbox.class));
        verify(outboxPublisher).publishImmediately(any(), any());
        verify(auditLogRepository).save(any(EInvoiceAuditLog.class));
    }

    @Test
    @DisplayName("2. Duplicate HTTP request with same idempotency key returns existing job")
    void testDuplicateHttpRequest_IdempotencyKeyReturnsExisting() {
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));
        when(gstRegistrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(tenantCompanyId))
                .thenReturn(Optional.of(supplierReg));

        EInvoiceJob existingJob = EInvoiceJob.builder()
                .id(UUID.randomUUID())
                .companyId(tenantCompanyId)
                .invoiceId(invoiceId)
                .status(EinvoiceStatus.QUEUED)
                .idempotencyKey("DUP-KEY-1")
                .isMock(true)
                .build();

        when(jobRepository.findByCompanyIdAndIdempotencyKey(tenantCompanyId, "DUP-KEY-1"))
                .thenReturn(Optional.of(existingJob));

        EInvoiceGenerateRequestDto req = EInvoiceGenerateRequestDto.builder()
                .idempotencyKey("DUP-KEY-1")
                .build();

        EInvoiceJobResponseDto response = einvoiceService.requestGeneration(invoiceId, req, tenantCompanyId);

        assertEquals(existingJob.getId(), response.getJobId());
        assertEquals(EinvoiceStatus.QUEUED, response.getStatus());
        verify(outboxRepository, never()).save(any());
        verify(outboxPublisher, never()).publishImmediately(any(), any());
    }

    @Test
    @DisplayName("3. Idempotently returns existing job when invoice already has a generated IRN")
    void testGenerate_AlreadyGenerated_ReturnsExistingJob() {
        validInvoice.setEinvoiceStatus(EinvoiceStatus.GENERATED);
        validInvoice.setIrn("MOCK-IRN-12345");

        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));

        EInvoiceJob existingJob = EInvoiceJob.builder()
                .id(UUID.randomUUID())
                .companyId(tenantCompanyId)
                .invoiceId(invoiceId)
                .status(EinvoiceStatus.GENERATED)
                .irn("MOCK-IRN-12345")
                .isMock(true)
                .build();
        when(jobRepository.findFirstByInvoiceIdAndCompanyIdOrderByCreatedAtDesc(invoiceId, tenantCompanyId))
                .thenReturn(Optional.of(existingJob));

        EInvoiceJobResponseDto response = einvoiceService.requestGeneration(invoiceId, null, tenantCompanyId);

        assertNotNull(response);
        assertEquals(EinvoiceStatus.GENERATED, response.getStatus());
        assertEquals("MOCK-IRN-12345", response.getIrn());
        verify(outboxRepository, never()).save(any());
        verify(outboxPublisher, never()).publishImmediately(any(), any());
    }

    @Test
    @DisplayName("4. Rejects generation when invoice is in DRAFT state")
    void testGenerate_UnapprovedInvoice_ThrowsBadRequest() {
        validInvoice.setStatus(InvoiceStatus.DRAFT);
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));

        assertThrows(BadRequestException.class, () ->
                einvoiceService.requestGeneration(invoiceId, null, tenantCompanyId));
    }

    @Test
    @DisplayName("5. Rejects generation when supplier GSTIN is missing")
    void testGenerate_MissingSupplierGstin_ThrowsBadRequest() {
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));
        when(gstRegistrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(tenantCompanyId))
                .thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () ->
                einvoiceService.requestGeneration(invoiceId, null, tenantCompanyId));
    }

    @Test
    @DisplayName("6. Rejects generation when buyer GSTIN is missing")
    void testGenerate_MissingBuyerGstin_ThrowsBadRequest() {
        validCustomer.setGstin(null);
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));
        when(gstRegistrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(tenantCompanyId))
                .thenReturn(Optional.of(supplierReg));

        assertThrows(BadRequestException.class, () ->
                einvoiceService.requestGeneration(invoiceId, null, tenantCompanyId));
    }

    @Test
    @DisplayName("7. Tenant isolation: Cannot access or generate e-Invoice for another tenant's invoice")
    void testTenantIsolation_CannotAccessOtherTenantInvoice() {
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));

        // Attempting to access invoice belonging to tenantCompanyId with otherCompanyId
        assertThrows(ResourceNotFoundException.class, () ->
                einvoiceService.requestGeneration(invoiceId, null, otherCompanyId));
    }

    @Test
    @DisplayName("8. Mock cancellation succeeds for an active generated IRN")
    void testCancelEInvoice_Success() {
        validInvoice.setEinvoiceStatus(EinvoiceStatus.GENERATED);
        validInvoice.setIrn("MOCK-IRN-VALID-123");

        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));

        EInvoiceCancelRequestDto cancelReq = EInvoiceCancelRequestDto.builder()
                .cancelReason("1")
                .remarks("Duplicate entry")
                .build();

        EInvoiceStatusResponseDto result = einvoiceService.cancelEInvoice(invoiceId, cancelReq, tenantCompanyId);

        assertNotNull(result);
        assertEquals(EinvoiceStatus.CANCELLED, validInvoice.getEinvoiceStatus());
        verify(auditLogRepository).save(any(EInvoiceAuditLog.class));
    }

    @Test
    @DisplayName("9. Cancellation fails if invoice does not have an active IRN")
    void testCancelEInvoice_NoIrn_ThrowsBadRequest() {
        validInvoice.setEinvoiceStatus(EinvoiceStatus.NOT_REQUESTED);
        validInvoice.setIrn(null);

        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));

        EInvoiceCancelRequestDto cancelReq = EInvoiceCancelRequestDto.builder()
                .cancelReason("1")
                .build();

        assertThrows(BadRequestException.class, () ->
                einvoiceService.cancelEInvoice(invoiceId, cancelReq, tenantCompanyId));
    }

    @Test
    @DisplayName("10. Rejects invalid client idempotency key format (e.g. short, spaces, symbols)")
    void testGenerate_InvalidIdempotencyKeyFormat_ThrowsBadRequest() {
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));
        when(gstRegistrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(tenantCompanyId))
                .thenReturn(Optional.of(supplierReg));

        EInvoiceGenerateRequestDto req = EInvoiceGenerateRequestDto.builder()
                .idempotencyKey("short") // Less than 8 chars
                .build();

        assertThrows(BadRequestException.class, () ->
                einvoiceService.requestGeneration(invoiceId, req, tenantCompanyId));
    }

    @Test
    @DisplayName("11. Fallback idempotency key is deterministic without timestamps")
    void testGenerate_DefaultIdempotencyKey_IsDeterministicWithoutTimestamp() {
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));
        when(gstRegistrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(tenantCompanyId))
                .thenReturn(Optional.of(supplierReg));
        when(jobRepository.findByCompanyIdAndIdempotencyKey(eq(tenantCompanyId), any())).thenReturn(Optional.empty());

        when(jobRepository.save(any(EInvoiceJob.class))).thenAnswer(invocation -> {
            EInvoiceJob job = invocation.getArgument(0);
            job.setId(UUID.randomUUID());
            return job;
        });
        when(outboxRepository.save(any(EInvoiceOutbox.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EInvoiceJobResponseDto response = einvoiceService.requestGeneration(invoiceId, null, tenantCompanyId);

        String expectedKey = "EINVOICE:GEN:" + tenantCompanyId + ":" + invoiceId;
        assertEquals(expectedKey, response.getIdempotencyKey());
        assertFalse(response.getIdempotencyKey().contains(String.valueOf(System.currentTimeMillis()).substring(0, 5)),
                "Fallback idempotency key must not be timestamp-generated");
    }

    @Test
    @DisplayName("12. Intercepts concurrent active job in QUEUED/PROCESSING without creating duplicate")
    void testGenerate_ActiveJobInProgress_ReturnsActiveJobWithoutDuplication() {
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));

        EInvoiceJob activeJob = EInvoiceJob.builder()
                .id(UUID.randomUUID())
                .companyId(tenantCompanyId)
                .invoiceId(invoiceId)
                .status(EinvoiceStatus.PROCESSING)
                .idempotencyKey("ACTIVE-KEY-999")
                .isMock(true)
                .build();

        when(jobRepository.findFirstByCompanyIdAndInvoiceIdAndStatusIn(eq(tenantCompanyId), eq(invoiceId), any()))
                .thenReturn(Optional.of(activeJob));

        EInvoiceJobResponseDto response = einvoiceService.requestGeneration(invoiceId, null, tenantCompanyId);

        assertEquals(activeJob.getId(), response.getJobId());
        assertEquals(EinvoiceStatus.PROCESSING, response.getStatus());
        verify(outboxRepository, never()).save(any());
        verify(outboxPublisher, never()).publishImmediately(any(), any());
    }

    @Test
    @DisplayName("13. Encrypts portal password and client secret at rest with AES-256-GCM")
    void testSaveConfig_EncryptsCredentialsAtRest() {
        when(gstRegistrationRepository.findById(gstRegId)).thenReturn(Optional.of(supplierReg));
        when(configRepository.findByCompanyIdAndGstRegistrationId(tenantCompanyId, gstRegId))
                .thenReturn(Optional.empty());
        when(configRepository.save(any(com.erp.account.modules.einvoice.entity.CompanyEInvoiceConfig.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        com.erp.account.modules.einvoice.dto.CompanyEInvoiceConfigDto dto =
                com.erp.account.modules.einvoice.dto.CompanyEInvoiceConfigDto.builder()
                        .gstRegistrationId(gstRegId)
                        .clientId("sandbox-client-123")
                        .clientSecret("super-secret-client-token")
                        .portalUsername("gst_user_1")
                        .portalPassword("SecretPass#2026")
                        .providerName(EInvoiceProviderType.MOCK)
                        .environment("SANDBOX")
                        .isActive(true)
                        .build();

        var result = einvoiceService.saveConfig(dto, tenantCompanyId);

        assertNotNull(result);
        assertTrue(result.isHasClientSecret());
        assertTrue(result.isHasPortalPassword());

        // Verify the saved entity has ENC:v1: prefix and does not store plaintext
        verify(configRepository).save(argThat(savedConfig -> {
            assertNotNull(savedConfig.getEncryptedClientSecret());
            assertNotNull(savedConfig.getEncryptedPortalPassword());
            assertTrue(savedConfig.getEncryptedClientSecret().startsWith("ENC:v1:"));
            assertTrue(savedConfig.getEncryptedPortalPassword().startsWith("ENC:v1:"));
            assertNotEquals("super-secret-client-token", savedConfig.getEncryptedClientSecret());
            assertNotEquals("SecretPass#2026", savedConfig.getEncryptedPortalPassword());
            return true;
        }));
    }

    @Test
    @DisplayName("14. Rejects configuration update when GST registration belongs to another company")
    void testSaveConfig_RejectsGstRegistrationOfOtherTenant() {
        UUID foreignCompanyId = UUID.randomUUID();
        supplierReg.setCompanyId(foreignCompanyId); // Belongs to different company

        when(gstRegistrationRepository.findById(gstRegId)).thenReturn(Optional.of(supplierReg));

        com.erp.account.modules.einvoice.dto.CompanyEInvoiceConfigDto dto =
                com.erp.account.modules.einvoice.dto.CompanyEInvoiceConfigDto.builder()
                        .gstRegistrationId(gstRegId)
                        .build();

        assertThrows(BadRequestException.class, () ->
                einvoiceService.saveConfig(dto, tenantCompanyId));
    }

    @Test
    @DisplayName("15. Rejects live provider configuration if master encryption key is missing")
    void testSaveConfig_RejectsLiveProviderWithoutMasterKey() {
        // Create an unconfigured service instance with empty key
        EInvoiceCryptoService unconfiguredCrypto = new EInvoiceCryptoService("");
        EInvoiceServiceImpl unconfiguredService = new EInvoiceServiceImpl(
                salesInvoiceRepository, gstRegistrationRepository, jobRepository,
                auditLogRepository, outboxRepository, configRepository, validator,
                outboxPublisher, properties, unconfiguredCrypto, List.of(mockProvider), objectMapper
        );

        when(gstRegistrationRepository.findById(gstRegId)).thenReturn(Optional.of(supplierReg));

        com.erp.account.modules.einvoice.dto.CompanyEInvoiceConfigDto dto =
                com.erp.account.modules.einvoice.dto.CompanyEInvoiceConfigDto.builder()
                        .gstRegistrationId(gstRegId)
                        .clientId("live-client-id")
                        .portalUsername("live_user")
                        .providerName(EInvoiceProviderType.NIC_DIRECT)
                        .build();

        assertThrows(BadRequestException.class, () ->
                unconfiguredService.saveConfig(dto, tenantCompanyId));
    }

    @Test
    @DisplayName("16. Retrying a previously FAILED job re-queues existing job without duplicate key violation")
    void testRequestGeneration_ReRetriesFailedJobSafely() {
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(validInvoice));
        when(gstRegistrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(tenantCompanyId))
                .thenReturn(Optional.of(supplierReg));

        EInvoiceJob failedJob = EInvoiceJob.builder()
                .id(UUID.randomUUID())
                .companyId(tenantCompanyId)
                .invoiceId(invoiceId)
                .status(EinvoiceStatus.FAILED)
                .idempotencyKey("KEY-RETRY-01")
                .failureReason("Simulated network failure")
                .retryCount(3)
                .isMock(true)
                .build();

        when(jobRepository.findByCompanyIdAndIdempotencyKey(tenantCompanyId, "KEY-RETRY-01"))
                .thenReturn(Optional.of(failedJob));
        when(jobRepository.save(any(EInvoiceJob.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(outboxRepository.save(any(EInvoiceOutbox.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EInvoiceGenerateRequestDto req = EInvoiceGenerateRequestDto.builder()
                .idempotencyKey("KEY-RETRY-01")
                .build();

        EInvoiceJobResponseDto response = einvoiceService.requestGeneration(invoiceId, req, tenantCompanyId);

        assertNotNull(response);
        assertEquals(failedJob.getId(), response.getJobId());
        assertEquals(EinvoiceStatus.QUEUED, response.getStatus());
        assertEquals(0, failedJob.getRetryCount());
        assertNull(failedJob.getFailureReason());

        verify(jobRepository).save(failedJob);
        verify(outboxRepository).save(any(EInvoiceOutbox.class));
        verify(outboxPublisher).publishImmediately(any(), any());
    }

    @Test
    @DisplayName("17. Different tenants using identical idempotency keys are isolated and independent")
    void testRequestGeneration_TenantIsolationWithSimilarIdempotencyKeys() {
        String sharedKey = "SHARED-KEY-12345";

        SalesInvoice otherInvoice = SalesInvoice.builder()
                .id(UUID.randomUUID())
                .companyId(otherCompanyId)
                .invoiceNumber("INV-OTHER-001")
                .invoiceDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .status(InvoiceStatus.APPROVED)
                .einvoiceStatus(EinvoiceStatus.NOT_REQUESTED)
                .customer(validCustomer)
                .subtotal(new BigDecimal("100000.00"))
                .taxAmount(new BigDecimal("18000.00"))
                .totalAmount(new BigDecimal("118000.00"))
                .salesInvoiceItems(validInvoice.getSalesInvoiceItems())
                .build();
        otherInvoice.setIsDeleted(false);

        GstRegistration otherReg = GstRegistration.builder()
                .id(UUID.randomUUID())
                .companyId(otherCompanyId)
                .gstin("27AAAAA0000A1Z5")
                .legalName("Other Company Ltd")
                .isDefault(true)
                .build();
        otherReg.setIsDeleted(false);

        when(salesInvoiceRepository.findById(otherInvoice.getId())).thenReturn(Optional.of(otherInvoice));
        when(gstRegistrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(otherCompanyId))
                .thenReturn(Optional.of(otherReg));
        when(jobRepository.findByCompanyIdAndIdempotencyKey(eq(otherCompanyId), eq(sharedKey)))
                .thenReturn(Optional.empty());

        when(jobRepository.save(any(EInvoiceJob.class))).thenAnswer(invocation -> {
            EInvoiceJob j = invocation.getArgument(0);
            j.setId(UUID.randomUUID());
            return j;
        });
        when(outboxRepository.save(any(EInvoiceOutbox.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EInvoiceGenerateRequestDto req = EInvoiceGenerateRequestDto.builder()
                .idempotencyKey(sharedKey)
                .build();

        EInvoiceJobResponseDto response = einvoiceService.requestGeneration(otherInvoice.getId(), req, otherCompanyId);

        assertNotNull(response);
        assertEquals(otherCompanyId, response.getCompanyId());
        assertEquals(sharedKey, response.getIdempotencyKey());
    }
}

