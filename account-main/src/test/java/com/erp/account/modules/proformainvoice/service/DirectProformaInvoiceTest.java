// package com.erp.account.modules.proformainvoice.service;

// import com.erp.account.modules.company.entity.Company;
// import com.erp.account.modules.company.repository.CompanyRepository;
// import com.erp.account.modules.customer.entity.Customer;
// import com.erp.account.modules.customer.repository.CustomerRepository;
// import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
// import
// com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
// import
// com.erp.account.modules.proformainvoice.dto.request.DirectPIItemRequest;
// import
// com.erp.account.modules.proformainvoice.dto.request.ProformaInvoiceDirectCreateRequest;
// import
// com.erp.account.modules.proformainvoice.dto.response.ProformaInvoiceResponse;
// import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
// import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
// import com.erp.account.modules.proformainvoice.mapper.ProformaInvoiceMapper;
// import
// com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
// import
// com.erp.account.modules.proformainvoice.service.impl.ProformaInvoiceServiceImpl;
// import
// com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
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
// import java.util.List;
// import java.util.Optional;
// import java.util.UUID;

// import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.any;
// import static org.mockito.ArgumentMatchers.eq;
// import static org.mockito.Mockito.when;

// @ExtendWith(MockitoExtension.class)
// public class DirectProformaInvoiceTest {

// @Mock
// private ProformaInvoiceRepository proformaInvoiceRepository;
// @Mock
// private CompanyRepository companyRepository;
// @Mock
// private CustomerRepository customerRepository;
// @Mock
// private VoucherSequenceService voucherSequenceService;
// @Mock
// private HsnSacMasterRepository hsnSacMasterRepository;
// @Mock
// private ProformaInvoiceMapper proformaInvoiceMapper;

// @InjectMocks
// private ProformaInvoiceServiceImpl proformaInvoiceService;

// private UUID companyId;
// private UUID customerId;
// private Company company;
// private Customer customer;
// private HsnSacMaster hsnSacMaster;

// @BeforeEach
// void setUp() {
// companyId = UUID.randomUUID();
// customerId = UUID.randomUUID();

// company = new Company();
// company.setId(companyId);
// company.setGstin("27AAAAA0000A1Z5");

// customer = new Customer();
// customer.setId(customerId);
// customer.setCompanyId(companyId);

// hsnSacMaster = new HsnSacMaster();
// hsnSacMaster.setCode("1234");
// }

// @Test
// void testCreateDirectProformaInvoice_Success() {
// ProformaInvoiceDirectCreateRequest request = new
// ProformaInvoiceDirectCreateRequest();
// request.setPiDate(LocalDate.now());
// request.setPiValidTill(LocalDate.now().plusDays(30));
// request.setCustomerId(customerId);
// request.setAdvanceRequired(true);
// request.setAdvanceAmount(new BigDecimal("1000"));

// DirectPIItemRequest itemRequest = new DirectPIItemRequest();
// itemRequest.setItemName("Test Item");
// itemRequest.setQuantity(new BigDecimal("10"));
// itemRequest.setUnitPrice(new BigDecimal("100"));
// itemRequest.setHsnSacCode("1234");
// request.setItems(List.of(itemRequest));

// try (MockedStatic<TenantUtils> tenantUtils =
// Mockito.mockStatic(TenantUtils.class)) {
// tenantUtils.when(() ->
// TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
// tenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());

// when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
// when(customerRepository.findByIdAndCompanyIdAndIsDeletedFalse(customerId,
// companyId)).thenReturn(Optional.of(customer));
// when(voucherSequenceService.generateNextProformaInvoiceNumber(eq(companyId),
// any())).thenReturn("PI-001");
// when(hsnSacMasterRepository.findByCodeAndIsDeletedFalse("1234")).thenReturn(Optional.of(hsnSacMaster));

// ProformaInvoice savedPi = new ProformaInvoice();
// savedPi.setPiNumber("PI-001");
// savedPi.setStatus(ProformaInvoiceStatus.DRAFT);
// when(proformaInvoiceRepository.saveAndFlush(any())).thenReturn(savedPi);

// ProformaInvoiceResponse expectedResponse = new ProformaInvoiceResponse();
// expectedResponse.setPiNumber("PI-001");
// expectedResponse.setStatus(ProformaInvoiceStatus.DRAFT);
// when(proformaInvoiceMapper.toResponse(savedPi)).thenReturn(expectedResponse);

// ProformaInvoiceResponse response =
// proformaInvoiceService.createDirectProformaInvoice(companyId, request);

// assertNotNull(response);
// assertEquals("PI-001", response.getPiNumber());
// assertEquals(ProformaInvoiceStatus.DRAFT, response.getStatus());
// }
// }
// }
