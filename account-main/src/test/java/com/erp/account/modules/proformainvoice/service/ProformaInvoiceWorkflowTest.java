// package com.erp.account.modules.proformainvoice.service;

// import com.erp.account.common.exception.BadRequestException;
// import com.erp.account.modules.company.entity.Company;
// import com.erp.account.modules.company.repository.CompanyRepository;
// import
// com.erp.account.modules.proformainvoice.dto.request.PIConversionRequest;
// import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
// import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
// import com.erp.account.modules.proformainvoice.mapper.ProformaInvoiceMapper;
// import
// com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
// import
// com.erp.account.modules.proformainvoice.service.impl.ProformaInvoiceServiceImpl;
// import com.erp.account.modules.quotation.entity.Quotation;
// import com.erp.account.modules.quotation.entity.QuotationStatus;
// import com.erp.account.modules.quotation.repository.QuotationRepository;
// import
// com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
// import com.erp.account.modules.receiptvoucher.service.ReceiptVoucherService;
// import com.erp.account.util.TenantUtils;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.Test;
// import org.junit.jupiter.api.extension.ExtendWith;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.MockedStatic;
// import org.mockito.Mockito;
// import org.mockito.junit.jupiter.MockitoExtension;

// import java.time.LocalDate;
// import java.util.Optional;
// import java.util.UUID;

// import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.any;
// import static org.mockito.Mockito.when;

// @ExtendWith(MockitoExtension.class)
// class ProformaInvoiceWorkflowTest {

// @Mock
// private ProformaInvoiceRepository proformaInvoiceRepository;

// @Mock
// private QuotationRepository quotationRepository;

// @Mock
// private CompanyRepository companyRepository;

// @Mock
// private VoucherSequenceService voucherSequenceService;

// @Mock
// private ReceiptVoucherService receiptVoucherService;

// @Mock
// private ProformaInvoiceMapper proformaInvoiceMapper;

// @InjectMocks
// private ProformaInvoiceServiceImpl proformaInvoiceService;

// private UUID companyId;
// private UUID quotationId;
// private UUID piId;
// private Quotation quotation;
// private ProformaInvoice pi;
// private PIConversionRequest conversionRequest;

// @BeforeEach
// void setUp() {
// companyId = UUID.randomUUID();
// quotationId = UUID.randomUUID();
// piId = UUID.randomUUID();

// quotation = new Quotation();
// quotation.setId(quotationId);
// quotation.setCompanyId(companyId);
// quotation.setStatus(QuotationStatus.ACCEPTED);
// quotation.setIsDeleted(false);

// pi = new ProformaInvoice();
// pi.setId(piId);
// pi.setCompanyId(companyId);
// pi.setStatus(ProformaInvoiceStatus.DRAFT);
// pi.setIsDeleted(false);

// conversionRequest = new PIConversionRequest();
// conversionRequest.setPiDate(LocalDate.now());
// conversionRequest.setPiValidTill(LocalDate.now().plusDays(30));
// }

// @Test
// void testCreateFromQuotation_Accepted_Success() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// tenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));
// when(proformaInvoiceRepository.findBySourceQuotationIdAndCompanyId(quotationId,
// companyId))
// .thenReturn(java.util.Collections.emptyList());
// when(companyRepository.findById(companyId)).thenReturn(Optional.of(new
// Company()));
// when(voucherSequenceService.generateNextProformaInvoiceNumber(any(), any()))
// .thenReturn("PI-2026-001");
// when(proformaInvoiceRepository.save(any(ProformaInvoice.class))).thenReturn(pi);
// when(proformaInvoiceMapper.toResponse(pi)).thenReturn(null);

// assertDoesNotThrow(() -> {
// proformaInvoiceService.createFromQuotation(companyId, quotationId,
// conversionRequest);
// });
// }
// }

// @Test
// void testCreateFromQuotation_Draft_Fails() {
// quotation.setStatus(QuotationStatus.DRAFT);
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));

// BadRequestException exception = assertThrows(BadRequestException.class, () ->
// {
// proformaInvoiceService.createFromQuotation(companyId, quotationId,
// conversionRequest);
// });
// assertTrue(exception.getMessage().contains("Only ACCEPTED quotations"));
// }
// }

// @Test
// void testChangeStatus_DraftToSent_Success() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// tenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());

// when(proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(piId,
// companyId))
// .thenReturn(Optional.of(pi));
// when(proformaInvoiceRepository.save(any(ProformaInvoice.class))).thenReturn(pi);

// assertDoesNotThrow(() -> {
// proformaInvoiceService.sendPI(companyId, piId);
// });
// assertEquals(ProformaInvoiceStatus.SENT, pi.getStatus());
// }
// }

// @Test
// void testChangeStatus_ConfirmedToCancelled_Fails() {
// pi.setStatus(ProformaInvoiceStatus.CONFIRMED);
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(piId,
// companyId))
// .thenReturn(Optional.of(pi));

// BadRequestException exception = assertThrows(BadRequestException.class, () ->
// {
// proformaInvoiceService.cancelPI(companyId, piId);
// });
// assertTrue(exception.getMessage().contains("Invalid PI status transition"));
// }
// }

// @Test
// void testCreateFromQuotation_NotAccepted_Fails() {
// // TEST 1: SENT quotation -> PI creation => Rejected because not ACCEPTED
// quotation.setStatus(QuotationStatus.SENT);
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));

// BadRequestException exception = assertThrows(BadRequestException.class, () ->
// {
// proformaInvoiceService.createFromQuotation(companyId, quotationId,
// conversionRequest);
// });
// assertTrue(exception.getMessage().contains("Only ACCEPTED quotations can be
// converted"));
// }
// }

// @Test
// void testCreateFromQuotation_Duplicate_Fails() {
// // TEST 4: Same quotation -> Create PI again => Rejected as duplicate
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));
// when(proformaInvoiceRepository.findBySourceQuotationIdAndCompanyId(quotationId,
// companyId))
// .thenReturn(java.util.Collections.singletonList(pi));

// BadRequestException exception = assertThrows(BadRequestException.class, () ->
// {
// proformaInvoiceService.createFromQuotation(companyId, quotationId,
// conversionRequest);
// });
// assertTrue(exception.getMessage().contains("A Proforma Invoice already exists
// for this quotation"));
// }
// }

// @Test
// void testCreateFromQuotation_WithAdvance_CreatesReceipt() {
// // TEST 3: ACCEPTED quotation -> Create PI with ₹25,000 advance => Expected:
// PI DRAFT created, Advance receipt created
// conversionRequest.setAdvanceRequired(true);
// conversionRequest.setAdvanceAmount(new java.math.BigDecimal("25000"));
// conversionRequest.setPaymentMode(com.erp.account.enums.PaymentMode.CASH);
// conversionRequest.setReceivableAccountId(UUID.randomUUID());
// conversionRequest.setReceiptAccountId(UUID.randomUUID());

// pi.setAdvanceRequired(true);
// pi.setAdvanceAmount(new java.math.BigDecimal("25000"));

// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// tenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));
// when(proformaInvoiceRepository.findBySourceQuotationIdAndCompanyId(quotationId,
// companyId))
// .thenReturn(java.util.Collections.emptyList());
// when(companyRepository.findById(companyId)).thenReturn(Optional.of(new
// Company()));
// when(voucherSequenceService.generateNextProformaInvoiceNumber(any(), any()))
// .thenReturn("PI-2026-002");
// when(proformaInvoiceRepository.saveAndFlush(any(ProformaInvoice.class))).thenReturn(pi);
// when(proformaInvoiceMapper.toResponse(pi)).thenReturn(null);

// assertDoesNotThrow(() -> {
// proformaInvoiceService.createFromQuotation(companyId, quotationId,
// conversionRequest);
// });

// // Verify receiptVoucherService.createReceipt was called
// Mockito.verify(receiptVoucherService, Mockito.times(1)).createReceipt(any(),
// any());
// }
// }
// @Test
// void testCreateFromQuotation_SoftDeletedPI_Succeeds() {
// // TEST C: ACCEPTED quotation with soft-deleted PI -> verify expected
// business behavior (allows creation)
// ProformaInvoice softDeletedPi = new ProformaInvoice();
// softDeletedPi.setId(UUID.randomUUID());
// softDeletedPi.setSourceQuotationId(quotationId);
// softDeletedPi.setIsDeleted(true);

// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// tenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));
// when(proformaInvoiceRepository.findBySourceQuotationIdAndCompanyId(quotationId,
// companyId))
// .thenReturn(java.util.Collections.singletonList(softDeletedPi));
// when(companyRepository.findById(companyId)).thenReturn(Optional.of(new
// Company()));
// when(voucherSequenceService.generateNextProformaInvoiceNumber(any(), any()))
// .thenReturn("PI-2026-003");
// when(proformaInvoiceRepository.saveAndFlush(any(ProformaInvoice.class))).thenReturn(pi);

// assertDoesNotThrow(() -> {
// proformaInvoiceService.createFromQuotation(companyId, quotationId,
// conversionRequest);
// });
// }
// }

// @Test
// void testCreateFromQuotation_ConcurrentDuplicate_Fails() {
// // TEST D: Two simultaneous requests -> second request gets duplicate
// response (via DataIntegrityViolationException)
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// tenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));
// when(proformaInvoiceRepository.findBySourceQuotationIdAndCompanyId(quotationId,
// companyId))
// .thenReturn(java.util.Collections.emptyList());
// when(companyRepository.findById(companyId)).thenReturn(Optional.of(new
// Company()));
// when(voucherSequenceService.generateNextProformaInvoiceNumber(any(), any()))
// .thenReturn("PI-2026-004");

// org.springframework.dao.DataIntegrityViolationException dbError =
// new org.springframework.dao.DataIntegrityViolationException("duplicate key
// value violates unique constraint \"idx_pi_source_quotation\"");

// when(proformaInvoiceRepository.saveAndFlush(any(ProformaInvoice.class))).thenThrow(dbError);

// BadRequestException exception = assertThrows(BadRequestException.class, () ->
// {
// proformaInvoiceService.createFromQuotation(companyId, quotationId,
// conversionRequest);
// });
// assertTrue(exception.getMessage().contains("Concurrent creation detected"));
// }
// }
// }
