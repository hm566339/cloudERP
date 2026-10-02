// package com.erp.account.common.service;

// import com.erp.account.common.exception.BadRequestException;
// import com.erp.account.modules.company.entity.Company;
// import com.erp.account.modules.gstslab.entity.GstSlab;
// import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
// import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
// import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.Test;

// import java.math.BigDecimal;

// import static org.junit.jupiter.api.Assertions.*;

// class GstCalculationServiceTest {

// private GstCalculationService gstCalculationService;
// private Company company;
// private SalesInvoice invoice;
// private SalesInvoiceItem item;
// private HsnSacMaster hsnSacMaster;
// private GstSlab slab;

// @BeforeEach
// void setUp() {
// gstCalculationService = new GstCalculationService();
// company = new Company();
// invoice = new SalesInvoice();
// item = new SalesInvoiceItem();
// item.setQuantity(new BigDecimal("1"));
// item.setUnitPrice(new BigDecimal("45000"));
// item.setTotalAmount(new BigDecimal("45000"));

// hsnSacMaster = new HsnSacMaster();
// slab = new GstSlab();
// hsnSacMaster.setGstSlab(slab);
// }

// @Test
// void test1_IntraState_Gst5() {
// company.setGstin("27AAAAA0000A1Z5"); // State 27
// invoice.setPlaceOfSupplyStateCode("27"); // State 27

// slab.setCgstRate(new BigDecimal("2.5"));
// slab.setSgstRate(new BigDecimal("2.5"));
// slab.setIgstRate(new BigDecimal("5"));

// gstCalculationService.calculateItemTaxes(item, company, invoice,
// hsnSacMaster);

// assertEquals(new BigDecimal("1125.0000"), item.getCgstAmount());
// assertEquals(new BigDecimal("1125.0000"), item.getSgstAmount());
// assertEquals(new BigDecimal("0.0000"), item.getIgstAmount());
// assertEquals(new BigDecimal("2250.0000"), item.getTaxAmount());
// }

// @Test
// void test2_IntraState_Gst18() {
// company.setGstin("09AAAAA0000A1Z5"); // State 09
// invoice.setPlaceOfSupplyStateCode("09"); // State 09

// slab.setCgstRate(new BigDecimal("9"));
// slab.setSgstRate(new BigDecimal("9"));
// slab.setIgstRate(new BigDecimal("18"));

// gstCalculationService.calculateItemTaxes(item, company, invoice,
// hsnSacMaster);

// assertEquals(new BigDecimal("4050.0000"), item.getCgstAmount());
// assertEquals(new BigDecimal("4050.0000"), item.getSgstAmount());
// assertEquals(new BigDecimal("0.0000"), item.getIgstAmount());
// assertEquals(new BigDecimal("8100.0000"), item.getTaxAmount());
// }

// @Test
// void test3_InterState_Gst5() {
// company.setGstin("27AAAAA0000A1Z5"); // State 27
// invoice.setPlaceOfSupplyStateCode("09"); // State 09

// slab.setCgstRate(new BigDecimal("2.5"));
// slab.setSgstRate(new BigDecimal("2.5"));
// slab.setIgstRate(new BigDecimal("5"));

// gstCalculationService.calculateItemTaxes(item, company, invoice,
// hsnSacMaster);

// assertEquals(new BigDecimal("0.0000"), item.getCgstAmount());
// assertEquals(new BigDecimal("0.0000"), item.getSgstAmount());
// assertEquals(new BigDecimal("2250.0000"), item.getIgstAmount());
// assertEquals(new BigDecimal("2250.0000"), item.getTaxAmount());
// }

// @Test
// void test4_InterState_Gst18() {
// company.setGstin("09AAAAA0000A1Z5"); // State 09
// invoice.setPlaceOfSupplyStateCode("27"); // State 27

// slab.setCgstRate(new BigDecimal("9"));
// slab.setSgstRate(new BigDecimal("9"));
// slab.setIgstRate(new BigDecimal("18"));

// gstCalculationService.calculateItemTaxes(item, company, invoice,
// hsnSacMaster);

// assertEquals(new BigDecimal("0.0000"), item.getCgstAmount());
// assertEquals(new BigDecimal("0.0000"), item.getSgstAmount());
// assertEquals(new BigDecimal("8100.0000"), item.getIgstAmount());
// assertEquals(new BigDecimal("8100.0000"), item.getTaxAmount());
// }

// @Test
// void test5_MissingCompanyState() {
// company.setGstin(null);
// invoice.setPlaceOfSupplyStateCode("27");

// assertThrows(BadRequestException.class, () -> {
// gstCalculationService.calculateItemTaxes(item, company, invoice,
// hsnSacMaster);
// });
// }

// @Test
// void test6_MissingPlaceOfSupplyState() {
// company.setGstin("27AAAAA0000A1Z5");
// invoice.setPlaceOfSupplyStateCode(null);

// assertThrows(BadRequestException.class, () -> {
// gstCalculationService.calculateItemTaxes(item, company, invoice,
// hsnSacMaster);
// });
// }

// @Test
// void test7_MissingApplicableGstRate_IntraState() {
// company.setGstin("27AAAAA0000A1Z5");
// invoice.setPlaceOfSupplyStateCode("27");

// slab.setCgstRate(null); // Missing rate
// slab.setSgstRate(new BigDecimal("9"));

// assertThrows(BadRequestException.class, () -> {
// gstCalculationService.calculateItemTaxes(item, company, invoice,
// hsnSacMaster);
// });
// }

// @Test
// void test7_MissingApplicableGstRate_InterState() {
// company.setGstin("27AAAAA0000A1Z5");
// invoice.setPlaceOfSupplyStateCode("09");

// slab.setIgstRate(null); // Missing rate

// assertThrows(BadRequestException.class, () -> {
// gstCalculationService.calculateItemTaxes(item, company, invoice,
// hsnSacMaster);
// });
// }
// }
