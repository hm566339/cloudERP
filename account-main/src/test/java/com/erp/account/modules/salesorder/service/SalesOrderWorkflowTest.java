// package com.erp.account.modules.salesorder.service;

// import com.erp.account.common.exception.BadRequestException;
// import com.erp.account.modules.company.entity.Company;
// import com.erp.account.modules.company.repository.CompanyRepository;
// import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
// import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceItem;
// import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
// import
// com.erp.account.modules.proformainvoice.repository.ProformaInvoiceItemRepository;
// import
// com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
// import com.erp.account.modules.salesorder.dto.request.SOConversionRequest;
// import
// com.erp.account.modules.salesorder.dto.request.SOItemConversionRequest;
// import com.erp.account.modules.salesorder.entity.SalesOrder;
// import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
// import com.erp.account.modules.salesorder.mapper.SalesOrderMapper;
// import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
// import com.erp.account.modules.salesorder.service.impl.SalesOrderServiceImpl;
// import
// com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
// import com.erp.account.modules.quotation.entity.Quotation;
// import com.erp.account.modules.quotation.entity.QuotationItem;
// import com.erp.account.modules.quotation.entity.QuotationStatus;
// import com.erp.account.modules.quotation.repository.QuotationRepository;
// import
// com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
// import com.erp.account.util.TenantUtils;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.Test;
// import org.junit.jupiter.api.extension.ExtendWith;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.MockedStatic;
// import org.mockito.Mockito;
// import org.mockito.junit.jupiter.MockitoExtension;

// import java.math.BigDecimal;
// import java.time.LocalDate;
// import java.util.Collections;
// import java.util.List;
// import java.util.Optional;
// import java.util.UUID;

// import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.any;
// import static org.mockito.Mockito.when;

// @ExtendWith(MockitoExtension.class)
// class SalesOrderWorkflowTest {

// @Mock
// private SalesOrderRepository salesOrderRepository;

// @Mock
// private ProformaInvoiceRepository proformaInvoiceRepository;

// @Mock
// private ProformaInvoiceItemRepository proformaInvoiceItemRepository;

// @Mock
// private QuotationRepository quotationRepository;

// @Mock
// private SalesInvoiceRepository salesInvoiceRepository;

// @Mock
// private CompanyRepository companyRepository;

// @Mock
// private VoucherSequenceService voucherSequenceService;

// @Mock
// private SalesOrderMapper salesOrderMapper;

// @InjectMocks
// private SalesOrderServiceImpl salesOrderService;

// private UUID companyId;
// private UUID piId;
// private UUID piItemId;
// private UUID soId;
// private ProformaInvoice pi;
// private ProformaInvoiceItem piItem;
// private SalesOrder so;
// private SOConversionRequest conversionRequest;

// @BeforeEach
// void setUp() {
// companyId = UUID.randomUUID();
// piId = UUID.randomUUID();
// piItemId = UUID.randomUUID();
// soId = UUID.randomUUID();

// pi = new ProformaInvoice();
// pi.setId(piId);
// pi.setCompanyId(companyId);
// pi.setStatus(ProformaInvoiceStatus.CONFIRMED);
// pi.setIsDeleted(false);
// pi.setSubtotal(new BigDecimal("1000.0000"));

// piItem = new ProformaInvoiceItem();
// piItem.setId(piItemId);
// piItem.setQuantity(new BigDecimal("10.0000"));
// piItem.setConvertedQuantity(BigDecimal.ZERO);
// piItem.calculateRemainingQuantity();
// piItem.setUnitPrice(new BigDecimal("100.0000"));

// so = new SalesOrder();
// so.setId(soId);
// so.setCompanyId(companyId);
// so.setStatus(SalesOrderStatus.DRAFT);
// so.setIsDeleted(false);

// SOItemConversionRequest reqItem = new SOItemConversionRequest();
// reqItem.setPiItemId(piItemId);
// reqItem.setQuantity(new BigDecimal("6.0000")); // Partial conversion

// conversionRequest = new SOConversionRequest();
// conversionRequest.setSoDate(LocalDate.now());
// conversionRequest.setItems(Collections.singletonList(reqItem));
// }

// @Test
// void testCreateFromProformaInvoice_PartialConversion_Success() {
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// tenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());

// when(proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(piId,
// companyId))
// .thenReturn(Optional.of(pi));
// when(companyRepository.findById(companyId)).thenReturn(Optional.of(new
// Company()));
// when(voucherSequenceService.generateNextSalesOrderNumber(any(), any()))
// .thenReturn("SO-2026-001");
// when(proformaInvoiceItemRepository.findLockedByProformaInvoiceIdAndCompanyIdAndIsDeletedFalse(piId,
// companyId))
// .thenReturn(List.of(piItem));
// when(salesOrderRepository.save(any(SalesOrder.class))).thenReturn(so);

// assertDoesNotThrow(() -> {
// salesOrderService.createFromProformaInvoice(companyId, piId,
// conversionRequest);
// });

// assertEquals(new BigDecimal("6.0000"), piItem.getConvertedQuantity());
// }
// }

// @Test
// void testCreateFromProformaInvoice_DraftPI_Fails() {
// pi.setStatus(ProformaInvoiceStatus.DRAFT);
// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(piId,
// companyId))
// .thenReturn(Optional.of(pi));

// BadRequestException exception = assertThrows(BadRequestException.class, () ->
// {
// salesOrderService.createFromProformaInvoice(companyId, piId,
// conversionRequest);
// });
// assertTrue(exception.getMessage().contains("Only CONFIRMED Proforma
// Invoices"));
// }
// }

// @Test
// void testCreateFromProformaInvoice_OverConversion_Fails() {
// // Request 15, but only 10 available
// conversionRequest.getItems().get(0).setQuantity(new BigDecimal("15.0000"));

// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// tenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());

// when(proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(piId,
// companyId))
// .thenReturn(Optional.of(pi));
// when(companyRepository.findById(companyId)).thenReturn(Optional.of(new
// Company()));
// when(voucherSequenceService.generateNextSalesOrderNumber(any(), any()))
// .thenReturn("SO-2026-001");
// when(proformaInvoiceItemRepository.findLockedByProformaInvoiceIdAndCompanyIdAndIsDeletedFalse(piId,
// companyId))
// .thenReturn(List.of(piItem));

// BadRequestException exception = assertThrows(BadRequestException.class, () ->
// {
// salesOrderService.createFromProformaInvoice(companyId, piId,
// conversionRequest);
// });
// assertTrue(exception.getMessage().contains("exceeds remaining quantity"));
// }
// }

// @Test
// void testCreateDirectFromQuotation_Success() {
// UUID quotationId = UUID.randomUUID();
// Quotation quotation = new Quotation();
// quotation.setId(quotationId);
// quotation.setCompanyId(companyId);
// quotation.setStatus(QuotationStatus.ACCEPTED);
// quotation.setIsDeleted(false);
// quotation.setCustomerId(UUID.randomUUID());
// quotation.setSubtotal(new BigDecimal("1000.0000"));

// QuotationItem qItem = new QuotationItem();
// qItem.setId(UUID.randomUUID());
// qItem.setQuantity(new BigDecimal("10.0000"));
// qItem.setUnitPrice(new BigDecimal("100.0000"));
// quotation.setQuotationItems(List.of(qItem));

// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// tenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));
// when(salesInvoiceRepository.countFullyPaidInvoicesByCustomer(companyId,
// quotation.getCustomerId()))
// .thenReturn(1L);
// when(salesOrderRepository.existsBySourceQuotationIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(false);
// when(companyRepository.findById(companyId)).thenReturn(Optional.of(new
// Company()));
// when(voucherSequenceService.generateNextSalesOrderNumber(any(), any()))
// .thenReturn("SO-2026-002");
// when(salesOrderRepository.save(any(SalesOrder.class))).thenReturn(so);

// assertDoesNotThrow(() -> {
// salesOrderService.createDirectFromQuotation(companyId, quotationId);
// });
// }
// }

// @Test
// void testCreateDirectFromQuotation_NotAccepted_Fails() {
// UUID quotationId = UUID.randomUUID();
// Quotation quotation = new Quotation();
// quotation.setId(quotationId);
// quotation.setCompanyId(companyId);
// quotation.setStatus(QuotationStatus.DRAFT);
// quotation.setIsDeleted(false);

// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));

// BadRequestException exception = assertThrows(BadRequestException.class, () ->
// {
// salesOrderService.createDirectFromQuotation(companyId, quotationId);
// });
// assertTrue(exception.getMessage().contains("Only ACCEPTED quotations can be
// converted"));
// }
// }

// @Test
// void testCreateDirectFromQuotation_NoPaidInvoices_Fails() {
// UUID quotationId = UUID.randomUUID();
// Quotation quotation = new Quotation();
// quotation.setId(quotationId);
// quotation.setCompanyId(companyId);
// quotation.setStatus(QuotationStatus.ACCEPTED);
// quotation.setIsDeleted(false);
// quotation.setCustomerId(UUID.randomUUID());

// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));
// when(salesInvoiceRepository.countFullyPaidInvoicesByCustomer(companyId,
// quotation.getCustomerId()))
// .thenReturn(0L);

// BadRequestException exception = assertThrows(BadRequestException.class, () ->
// {
// salesOrderService.createDirectFromQuotation(companyId, quotationId);
// });
// assertTrue(exception.getMessage().contains("At least one previous Sales
// Invoice must be fully paid"));
// }
// }

// @Test
// void testCreateDirectFromQuotation_DuplicateSO_Fails() {
// UUID quotationId = UUID.randomUUID();
// Quotation quotation = new Quotation();
// quotation.setId(quotationId);
// quotation.setCompanyId(companyId);
// quotation.setStatus(QuotationStatus.ACCEPTED);
// quotation.setIsDeleted(false);
// quotation.setCustomerId(UUID.randomUUID());

// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));
// when(salesInvoiceRepository.countFullyPaidInvoicesByCustomer(companyId,
// quotation.getCustomerId()))
// .thenReturn(1L);
// when(salesOrderRepository.existsBySourceQuotationIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(true);

// BadRequestException exception = assertThrows(BadRequestException.class, () ->
// {
// salesOrderService.createDirectFromQuotation(companyId, quotationId);
// });
// assertTrue(exception.getMessage().contains("Sales Order already exists for
// this quotation"));
// }
// }
// }
