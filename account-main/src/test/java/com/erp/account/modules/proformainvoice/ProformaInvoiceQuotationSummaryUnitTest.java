// package com.erp.account.modules.proformainvoice;

// import com.erp.account.modules.company.repository.CompanyRepository;
// import com.erp.account.modules.customer.entity.Customer;
// import
// com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
// import
// com.erp.account.modules.proformainvoice.dto.response.ProformaInvoiceResponse;
// import
// com.erp.account.modules.proformainvoice.dto.response.profile.ProformaInvoiceProfileResponse;
// import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
// import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceItem;
// import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
// import com.erp.account.modules.proformainvoice.mapper.ProformaInvoiceMapper;
// import
// com.erp.account.modules.proformainvoice.mapper.ProformaInvoiceMapperImpl;
// import
// com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
// import
// com.erp.account.modules.proformainvoice.service.impl.ProformaInvoiceServiceImpl;
// import com.erp.account.modules.quotation.dto.response.QuotationSummaryDTO;
// import com.erp.account.modules.quotation.entity.Quotation;
// import com.erp.account.modules.quotation.entity.QuotationStatus;
// import com.erp.account.modules.quotation.repository.QuotationRepository;
// import
// com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
// import com.erp.account.util.TenantUtils;
// import com.fasterxml.jackson.databind.JsonNode;
// import com.fasterxml.jackson.databind.ObjectMapper;
// import com.fasterxml.jackson.databind.SerializationFeature;
// import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
// import org.junit.jupiter.api.Test;
// import org.mockito.MockedStatic;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.PageImpl;
// import org.springframework.data.domain.PageRequest;
// import org.springframework.data.domain.Pageable;
// import org.springframework.data.jpa.domain.Specification;

// import java.math.BigDecimal;
// import java.time.LocalDate;
// import java.util.List;
// import java.util.Optional;
// import java.util.UUID;

// import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.*;
// import static org.mockito.Mockito.*;

// class ProformaInvoiceQuotationSummaryUnitTest {

// private final ProformaInvoiceMapper mapper = new ProformaInvoiceMapperImpl();
// private final ObjectMapper objectMapper = new ObjectMapper()
// .registerModule(new JavaTimeModule())
// .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

// private final UUID companyId = UUID.randomUUID();
// private final UUID customerId = UUID.randomUUID();
// private final UUID quotationId = UUID.randomUUID();

// private Customer customer() {
// Customer customer = new Customer();
// customer.setId(customerId);
// customer.setCustomerCode("C-001");
// customer.setCustomerName("Mohit");
// return customer;
// }

// private Quotation quotation(String number, Customer customer) {
// Quotation quotation = new Quotation();
// quotation.setId(quotationId);
// quotation.setCompanyId(companyId);
// quotation.setQuotationNumber(number);
// quotation.setQuotationDate(LocalDate.of(2026, 8, 28));
// quotation.setValidUntil(LocalDate.of(2026, 9, 27));
// quotation.setStatus(QuotationStatus.ACCEPTED);
// quotation.setCustomerId(customer.getId());
// quotation.setCustomer(customer);
// quotation.setQuotationCurrency("INR");
// quotation.setSubtotal(new BigDecimal("45000"));
// quotation.setDiscountAmount(new BigDecimal("0"));
// quotation.setTaxAmount(new BigDecimal("8100"));
// quotation.setTotalAmount(new BigDecimal("53100"));
// return quotation;
// }

// private ProformaInvoice pi(String piNumber, UUID sourceQuotationId, Customer
// customer) {
// ProformaInvoice pi = new ProformaInvoice();
// pi.setId(UUID.randomUUID());
// pi.setCompanyId(companyId);
// pi.setPiNumber(piNumber);
// pi.setPiDate(LocalDate.of(2026, 8, 28));
// pi.setPiValidTill(LocalDate.of(2026, 9, 27));
// pi.setStatus(ProformaInvoiceStatus.DRAFT);
// pi.setSourceQuotationId(sourceQuotationId);
// pi.setSourceQuotationNumber("QT-2026-08-000001");
// pi.setCustomerId(customer.getId());
// pi.setCustomer(customer);
// pi.setCurrency("INR");
// pi.setSubtotal(new BigDecimal("45000"));
// pi.setDiscountAmount(new BigDecimal("0"));
// pi.setTaxAmount(new BigDecimal("8100"));
// pi.setTotalAmount(new BigDecimal("53100"));
// return pi;
// }

// @Test
// void toQuotationSummaryDTO_mapsAllFields() {
// Customer customer = customer();
// Quotation quotation = quotation("QT-2026-08-000001", customer);

// QuotationSummaryDTO dto = mapper.toQuotationSummaryDTO(quotation);

// assertNotNull(dto);
// assertEquals(quotationId, dto.getId());
// assertEquals("QT-2026-08-000001", dto.getQuotationNumber());
// assertEquals(LocalDate.of(2026, 8, 28), dto.getQuotationDate());
// assertEquals("ACCEPTED", dto.getStatus());
// assertEquals(LocalDate.of(2026, 9, 27), dto.getValidTill());
// assertEquals(customerId, dto.getCustomerId());
// assertEquals("Mohit", dto.getCustomerName());
// assertEquals("INR", dto.getCurrency());
// assertEquals(new BigDecimal("45000"), dto.getSubtotal());
// assertEquals(new BigDecimal("0"), dto.getDiscountAmount());
// assertEquals(new BigDecimal("8100"), dto.getTaxAmount());
// assertEquals(new BigDecimal("53100"), dto.getTotalAmount());
// }

// @Test
// void toQuotationSummaryDTO_nullQuotation_returnsNull() {
// assertNull(mapper.toQuotationSummaryDTO(null));
// }

// @Test
// void responseJSON_containsQuotationSummary_withoutCircularEntityLeak() throws
// Exception {
// Customer customer = customer();
// Quotation quotation = quotation("QT-2026-08-000001", customer);
// ProformaInvoice pi = pi("PI-2026-08-000003", quotationId, customer);

// ProformaInvoiceResponse response = mapper.toResponse(pi);
// assertNull(response.getQuotation());
// response.setQuotation(mapper.toQuotationSummaryDTO(quotation));

// String json = objectMapper.writeValueAsString(response);
// JsonNode node = objectMapper.readTree(json);

// assertEquals("PI-2026-08-000003", node.get("piNumber").asText());
// assertEquals(quotationId.toString(), node.get("sourceQuotationId").asText());
// assertEquals("QT-2026-08-000001",
// node.get("sourceQuotationNumber").asText());

// JsonNode quotationNode = node.get("quotation");
// assertNotNull(quotationNode);
// assertEquals(quotationId.toString(), quotationNode.get("id").asText());
// assertEquals("QT-2026-08-000001",
// quotationNode.get("quotationNumber").asText());
// assertEquals("ACCEPTED", quotationNode.get("status").asText());
// assertEquals("Mohit", quotationNode.get("customerName").asText());
// assertEquals("INR", quotationNode.get("currency").asText());
// assertEquals(0, quotationNode.get("totalAmount").decimalValue().compareTo(new
// BigDecimal("53100")));

// assertFalse(json.contains("\"sourceQuotation\""));
// assertFalse(json.contains("\"quotationItems\""));
// assertFalse(json.contains("\"proformaInvoices\""));
// assertFalse(json.contains("\"company\""));
// }

// @Test
// void profileResponseJSON_containsQuotationSummary_andItems() throws Exception
// {
// Customer customer = customer();
// Quotation quotation = quotation("QT-2026-08-000001", customer);
// ProformaInvoice pi = pi("PI-2026-08-000003", quotationId, customer);
// pi.addProformaInvoiceItem(buildItem("1"));

// ProformaInvoiceProfileResponse profile = mapper.toProfileResponse(pi);
// assertNull(profile.getQuotation());
// profile.setQuotation(mapper.toQuotationSummaryDTO(quotation));

// assertEquals(1, profile.getItems().size());
// assertNotNull(profile.getItems().get(0).getSourceQuotationItemId());

// String json = objectMapper.writeValueAsString(profile);
// JsonNode node = objectMapper.readTree(json);

// assertNotNull(node.get("quotation"));
// assertEquals("ACCEPTED", node.get("quotation").get("status").asText());
// assertEquals("Mohit", node.get("customerName").asText());
// assertNotNull(node.get("items"));
// assertFalse(json.contains("\"proformaInvoices\""));
// assertFalse(json.contains("\"sourceQuotationItem\""));
// assertFalse(json.contains("\"quotationItems\""));
// }

// @Test
// void prePersist_setsAuditFieldsForNewRecord() {
// ProformaInvoice pi = new ProformaInvoice();
// pi.setIsDeleted(null);
// pi.setCreatedAt(null);
// pi.setUpdatedAt(null);

// pi.prePersist();

// assertFalse(pi.getIsDeleted());
// assertNotNull(pi.getCreatedAt());
// assertNotNull(pi.getUpdatedAt());
// }

// @Test
// void getProformaInvoiceById_attachesQuotationViaSingleScopedQuery() {
// ProformaInvoiceRepository piRepo = mock(ProformaInvoiceRepository.class);
// QuotationRepository quotationRepository = mock(QuotationRepository.class);
// ProformaInvoiceServiceImpl service = new ProformaInvoiceServiceImpl(
// piRepo, quotationRepository, mock(CompanyRepository.class),
// mock(VoucherSequenceService.class), mapper,
// mock(HsnSacMasterRepository.class));

// Customer customer = customer();
// Quotation quotation = quotation("QT-2026-08-000001", customer);
// ProformaInvoice pi = pi("PI-2026-08-000003", quotationId, customer);
// pi.addProformaInvoiceItem(buildItem("MACHINE"));
// UUID piId = pi.getId();

// when(piRepo.findByIdAndCompanyIdAndIsDeletedFalse(piId,
// companyId)).thenReturn(Optional.of(pi));
// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId))
// .thenReturn(Optional.of(quotation));

// try (MockedStatic<TenantUtils> tenantUtils = mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// ProformaInvoiceProfileResponse profile =
// service.getProformaInvoiceById(companyId, piId);

// assertNotNull(profile.getQuotation());
// assertEquals("QT-2026-08-000001",
// profile.getQuotation().getQuotationNumber());
// assertEquals("ACCEPTED", profile.getQuotation().getStatus());
// assertEquals("Mohit", profile.getQuotation().getCustomerName());
// assertEquals("INR", profile.getQuotation().getCurrency());
// assertEquals(0, profile.getQuotation().getTotalAmount().compareTo(new
// BigDecimal("53100")));
// assertNotNull(profile.getItems().get(0).getSourceQuotationItemId());

// verify(quotationRepository).findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId);
// }
// }

// @Test
// void getProformaInvoiceById_quotationMissingOrForeignReturnsNullSummary() {
// ProformaInvoiceRepository piRepo = mock(ProformaInvoiceRepository.class);
// QuotationRepository quotationRepository = mock(QuotationRepository.class);
// ProformaInvoiceServiceImpl service = new ProformaInvoiceServiceImpl(
// piRepo, quotationRepository, mock(CompanyRepository.class),
// mock(VoucherSequenceService.class), mapper,
// mock(HsnSacMasterRepository.class));

// Customer customer = customer();
// ProformaInvoice pi = pi("PI-2026-08-000003", quotationId, customer);
// UUID piId = pi.getId();

// when(piRepo.findByIdAndCompanyIdAndIsDeletedFalse(piId,
// companyId)).thenReturn(Optional.of(pi));
// when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(any(),
// any())).thenReturn(Optional.empty());

// try (MockedStatic<TenantUtils> tenantUtils = mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// ProformaInvoiceProfileResponse profile =
// service.getProformaInvoiceById(companyId, piId);

// assertNull(profile.getQuotation());
// verify(quotationRepository).findByIdAndCompanyIdAndIsDeletedFalse(quotationId,
// companyId);
// }
// }

// @Test
// void getAllProformaInvoices_batchLoadsQuotationSummariesNoNPlus1() {
// ProformaInvoiceRepository piRepo = mock(ProformaInvoiceRepository.class);
// QuotationRepository quotationRepository = mock(QuotationRepository.class);
// ProformaInvoiceServiceImpl service = new ProformaInvoiceServiceImpl(
// piRepo, quotationRepository, mock(CompanyRepository.class),
// mock(VoucherSequenceService.class), mapper,
// mock(HsnSacMasterRepository.class));

// Customer customer = customer();
// Quotation quotation = quotation("QT-2026-08-000001", customer);
// ProformaInvoice pi1 = pi("PI-2026-08-000003", quotationId, customer);
// ProformaInvoice pi2 = pi("PI-2026-08-000004", quotationId, customer);
// Page<ProformaInvoice> page = new PageImpl<>(List.of(pi1, pi2));

// when(piRepo.findAll(any(Specification.class),
// any(Pageable.class))).thenReturn(page);
// when(quotationRepository.findAllByIdInAndCompanyIdAndIsDeletedFalse(anyCollection(),
// eq(companyId)))
// .thenReturn(List.of(quotation));

// try (MockedStatic<TenantUtils> tenantUtils = mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

// Page<ProformaInvoiceResponse> result = service.getAllProformaInvoices(
// companyId, null, PageRequest.of(0, 10));

// assertEquals(2, result.getContent().size());
// result.getContent().forEach(r -> {
// assertNotNull(r.getQuotation());
// assertEquals("QT-2026-08-000001", r.getQuotation().getQuotationNumber());
// assertEquals("ACCEPTED", r.getQuotation().getStatus());
// });

// verify(quotationRepository, times(1))
// .findAllByIdInAndCompanyIdAndIsDeletedFalse(anyCollection(), eq(companyId));
// verify(quotationRepository,
// never()).findByIdAndCompanyIdAndIsDeletedFalse(any(), any());
// }
// }

// private ProformaInvoiceItem buildItem(String name) {
// ProformaInvoiceItem item = new ProformaInvoiceItem();
// item.setId(UUID.randomUUID());
// item.setSourceQuotationItemId(UUID.randomUUID());
// item.setItemName(name);
// item.setQuantity(new BigDecimal("1"));
// item.setUnitPrice(new BigDecimal("45000"));
// item.setTaxableAmount(new BigDecimal("45000"));
// item.setTaxAmount(new BigDecimal("8100"));
// item.setTotalAmount(new BigDecimal("53100"));
// return item;
// }
// }