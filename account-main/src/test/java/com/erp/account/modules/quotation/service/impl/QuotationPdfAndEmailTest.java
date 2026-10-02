package com.erp.account.modules.quotation.service.impl;

import com.erp.account.modules.bankaccount.dto.response.InvoiceBankDetailsDto;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.entity.CustomerAddress;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class QuotationPdfAndEmailTest {

    private TemplateEngine engine;

    @BeforeEach
    public void setup() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        engine = new TemplateEngine();
        engine.setTemplateResolver(resolver);
    }

    @Test
    public void testIntraStateQuotationPdf() throws Exception {
        Quotation q = new Quotation();
        q.setId(java.util.UUID.randomUUID());
        q.setQuotationNumber("QTN-2026-0001");
        q.setQuotationDate(LocalDate.of(2026, 8, 24));
        q.setValidUntil(LocalDate.of(2026, 9, 24));
        q.setSubtotal(new BigDecimal("50000.00"));
        q.setDiscountAmount(new BigDecimal("5000.00"));
        q.setTaxAmount(new BigDecimal("8100.00"));
        q.setFreightCharges(new BigDecimal("500.00"));
        q.setTotalBeforeRoundOff(new BigDecimal("53600.00"));
        q.setRoundOff(new BigDecimal("0.00"));
        q.setTotalAmount(new BigDecimal("53600.00"));
        q.setPlaceOfSupplyStateCode("10");
        q.setPaymentTerms("50% Advance, balance on delivery");
        q.setDeliveryTerms("EXW Factory");
        q.setWarrantyTerms("1 Year Comprehensive Warranty");
        q.setTermsAndConditions("1. Quotation valid for 30 days.\n2. Taxes as applicable.");
        q.setNotes("Thank you for your business inquiry.");
        q.setReferenceNumber("REQ-2026-889");

        Company c = new Company();
        c.setCompanyName("Kasera Enterprise Pvt Ltd");
        c.setLegalName("Kasera PVT");
        c.setAddressLine1("123 Industrial Area, Phase 1");
        c.setAddressLine2("Patna City");
        c.setCity("Patna");
        c.setState("Bihar");
        c.setPostalCode("800008");
        c.setCountry("India");
        c.setEmail("contact@kasera.com");
        c.setPhone("+91-9504400880");
        c.setCompanyCode("MSME-884920");
        c.setGstin("10ABCDE1234F1Z5");

        Customer cust = new Customer();
        cust.setCustomerName("Mohit Global Traders");
        GstStateCode customerState = new GstStateCode();
        customerState.setStateName("Bihar");
        CustomerAddress customerAddress = new CustomerAddress();
        customerAddress.setCustomer(cust);
        customerAddress.setAddressType("BILLING");
        customerAddress.setAddressLine1("456 Commercial Hub");
        customerAddress.setCity("Patna");
        customerAddress.setGstState(customerState);
        customerAddress.setCountry("India");
        customerAddress.setIsDefault(true);
        customerAddress.setIsActive(true);
        customerAddress.setIsDeleted(false);
        cust.setAddresses(List.of(customerAddress));
        cust.setGstin("10XYZAB5678C1Z2");
        cust.setPhone("+91-9876543210");

        q.setCompany(c);
        q.setCustomer(cust);

        HsnSacMaster hsn = new HsnSacMaster();
        hsn.setCode("8418");

        QuotationItem item1 = new QuotationItem();
        item1.setItemName("Commercial Display Freezer 500L");
        item1.setDescription("Heavy-duty stainless steel build with LED interior lighting");
        item1.setQuantity(new BigDecimal("2.00"));
        item1.setUnitPrice(new BigDecimal("25000.00"));
        item1.setDiscountPercent(new BigDecimal("10.00"));
        item1.setTaxableAmount(new BigDecimal("45000.00"));
        item1.setCgstRate(new BigDecimal("9.00"));
        item1.setCgstAmount(new BigDecimal("4050.00"));
        item1.setSgstRate(new BigDecimal("9.00"));
        item1.setSgstAmount(new BigDecimal("4050.00"));
        item1.setTotalAmount(new BigDecimal("53100.00"));
        item1.setHsnSacMaster(hsn);

        InvoiceBankDetailsDto bank = new InvoiceBankDetailsDto();
        bank.setBankName("State Bank of India");
        bank.setAccountHolderName("Kasera Enterprise Pvt Ltd");
        bank.setAccountNumber("123456789012");
        bank.setIfscCode("SBIN0001234");

        Context context = new Context();
        context.setVariable("quotation", q);
        context.setVariable("company", c);
        context.setVariable("customer", cust);
        context.setVariable("items", List.of(item1));
        context.setVariable("totalQuantity", new BigDecimal("2"));
        context.setVariable("isIntraState", true);
        context.setVariable("companyStateCode", "10");
        context.setVariable("companyGstin", "10ABCDE1234F1Z5");
        context.setVariable("customerStateCode", "10");
        context.setVariable("placeOfSupplyName", "Bihar");
        context.setVariable("totalCgst", new BigDecimal("4050.00"));
        context.setVariable("totalSgst", new BigDecimal("4050.00"));
        context.setVariable("totalIgst", BigDecimal.ZERO);
        context.setVariable("billAddress", "456 Commercial Hub");
        context.setVariable("billCity", "Patna");
        context.setVariable("billState", "Bihar");
        context.setVariable("billCountry", "India");
        context.setVariable("shipAddress", "456 Commercial Hub");
        context.setVariable("shipCity", "Patna");
        context.setVariable("shipState", "Bihar");
        context.setVariable("shipCountry", "India");
        context.setVariable("shipPostalCode", "800008");
        context.setVariable("bankAccount", bank);
        context.setVariable("qrCodeImage", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
        context.setVariable("amountInWords", "Rupees Fifty Three Thousand Six Hundred Only");

        String html = engine.process("quotation-template", context);
        assertNotNull(html);
        assertTrue(html.contains("Sales Quotation"));
        assertTrue(html.contains("QTN-2026-0001"));
        assertTrue(html.contains("Kasera Enterprise Pvt Ltd"));
        assertTrue(html.contains("Mohit Global Traders"));
        assertTrue(html.contains("Commercial Display Freezer 500L"));
        assertTrue(html.contains("CGST"));
        assertTrue(html.contains("SGST"));

        ITextRenderer renderer = new ITextRenderer();
        renderer.setDocumentFromString(html);
        renderer.layout();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        renderer.createPDF(baos);
        byte[] pdfBytes = baos.toByteArray();

        assertTrue(pdfBytes.length > 1000);
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);

        com.lowagie.text.pdf.PdfReader reader = new com.lowagie.text.pdf.PdfReader(pdfBytes);
        assertTrue(reader.getNumberOfPages() >= 1);
        byte[] page1 = reader.getPageContent(1);
        assertNotNull(page1);
        assertTrue(page1.length > 500);
    }

    @Test
    public void testInterStateQuotationPdf() throws Exception {
        Quotation q = new Quotation();
        q.setId(java.util.UUID.randomUUID());
        q.setQuotationNumber("QTN-INTER-002");
        q.setQuotationDate(LocalDate.now());
        q.setValidUntil(LocalDate.now().plusDays(15));
        q.setSubtotal(new BigDecimal("100000.00"));
        q.setTaxAmount(new BigDecimal("18000.00"));
        q.setTotalAmount(new BigDecimal("118000.00"));
        q.setPlaceOfSupplyStateCode("27"); // Maharashtra (Inter-state from Bihar 10)

        Company c = new Company();
        c.setCompanyName("Kasera Enterprise Pvt Ltd");

        Customer cust = new Customer();
        cust.setCustomerName("Mumbai Retailers Ltd");

        q.setCompany(c);
        q.setCustomer(cust);

        QuotationItem item = new QuotationItem();
        item.setItemName("Industrial Chiller");
        item.setQuantity(new BigDecimal("1"));
        item.setUnitPrice(new BigDecimal("100000.00"));
        item.setTaxableAmount(new BigDecimal("100000.00"));
        item.setIgstRate(new BigDecimal("18.00"));
        item.setIgstAmount(new BigDecimal("18000.00"));
        item.setTotalAmount(new BigDecimal("118000.00"));

        Context context = new Context();
        context.setVariable("quotation", q);
        context.setVariable("company", c);
        context.setVariable("customer", cust);
        context.setVariable("items", List.of(item));
        context.setVariable("totalQuantity", new BigDecimal("1"));
        context.setVariable("isIntraState", false);
        context.setVariable("companyStateCode", "10");
        context.setVariable("companyGstin", "10ABCDE1234F1Z5");
        context.setVariable("customerStateCode", "27");
        context.setVariable("placeOfSupplyName", "Maharashtra");
        context.setVariable("totalCgst", BigDecimal.ZERO);
        context.setVariable("totalSgst", BigDecimal.ZERO);
        context.setVariable("totalIgst", new BigDecimal("18000.00"));
        context.setVariable("billAddress", "Andheri West");
        context.setVariable("billCity", "Mumbai");
        context.setVariable("billState", "Maharashtra");
        context.setVariable("billCountry", "India");
        context.setVariable("shipAddress", "Andheri West");
        context.setVariable("shipCity", "Mumbai");
        context.setVariable("shipState", "Maharashtra");
        context.setVariable("shipCountry", "India");
        context.setVariable("shipPostalCode", "400058");
        context.setVariable("bankAccount", null);
        context.setVariable("qrCodeImage", null);
        context.setVariable("amountInWords", "Rupees One Lakh Eighteen Thousand Only");

        String html = engine.process("quotation-template", context);
        assertNotNull(html);
        assertTrue(html.contains("IGST"));

        ITextRenderer renderer = new ITextRenderer();
        renderer.setDocumentFromString(html);
        renderer.layout();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        renderer.createPDF(baos);
        byte[] pdfBytes = baos.toByteArray();

        com.lowagie.text.pdf.PdfReader reader = new com.lowagie.text.pdf.PdfReader(pdfBytes);
        assertTrue(reader.getNumberOfPages() >= 1);
        byte[] page1 = reader.getPageContent(1);
        assertNotNull(page1);
        assertTrue(page1.length > 500);
    }

    @Test
    public void testNullFieldsQuotationPdf() throws Exception {
        Quotation q = new Quotation();
        q.setId(java.util.UUID.randomUUID());
        q.setQuotationNumber("QTN-NULL-003");
        q.setQuotationDate(null);
        q.setValidUntil(null);
        q.setSubtotal(null);
        q.setDiscountAmount(null);
        q.setTaxAmount(null);
        q.setFreightCharges(null);
        q.setTotalBeforeRoundOff(null);
        q.setRoundOff(null);
        q.setTotalAmount(null);
        q.setPlaceOfSupplyStateCode(null);
        q.setPaymentTerms(null);
        q.setDeliveryTerms(null);
        q.setWarrantyTerms(null);
        q.setTermsAndConditions(null);
        q.setNotes(null);
        q.setReferenceNumber(null);

        Company c = new Company();
        c.setCompanyName("Company Only");

        Customer cust = new Customer();
        cust.setCustomerName("Customer Only");

        q.setCompany(c);
        q.setCustomer(cust);

        QuotationItem item = new QuotationItem();
        item.setItemName("Item with all null attributes");
        item.setQuantity(null);
        item.setUnitPrice(null);
        item.setDiscountPercent(null);
        item.setDiscountAmount(null);
        item.setTaxableAmount(null);
        item.setCgstRate(null);
        item.setCgstAmount(null);
        item.setSgstRate(null);
        item.setSgstAmount(null);
        item.setIgstRate(null);
        item.setIgstAmount(null);
        item.setTotalAmount(null);
        item.setHsnSacMaster(null);

        Context context = new Context();
        context.setVariable("quotation", q);
        context.setVariable("company", c);
        context.setVariable("customer", cust);
        context.setVariable("items", List.of(item));
        context.setVariable("totalQuantity", BigDecimal.ZERO);
        context.setVariable("isIntraState", true);
        context.setVariable("companyStateCode", "");
        context.setVariable("companyGstin", "");
        context.setVariable("customerStateCode", "");
        context.setVariable("placeOfSupplyName", "");
        context.setVariable("totalCgst", BigDecimal.ZERO);
        context.setVariable("totalSgst", BigDecimal.ZERO);
        context.setVariable("totalIgst", BigDecimal.ZERO);
        context.setVariable("billAddress", "");
        context.setVariable("billCity", "");
        context.setVariable("billState", "");
        context.setVariable("billCountry", "");
        context.setVariable("shipAddress", "");
        context.setVariable("shipCity", "");
        context.setVariable("shipState", "");
        context.setVariable("shipCountry", "");
        context.setVariable("shipPostalCode", "");
        context.setVariable("bankAccount", null);
        context.setVariable("qrCodeImage", null);
        context.setVariable("amountInWords", "");

        String html = engine.process("quotation-template", context);
        assertNotNull(html);
        assertTrue(html.contains("Sales Quotation"));

        ITextRenderer renderer = new ITextRenderer();
        renderer.setDocumentFromString(html);
        renderer.layout();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        renderer.createPDF(baos);
        byte[] pdfBytes = baos.toByteArray();

        com.lowagie.text.pdf.PdfReader reader = new com.lowagie.text.pdf.PdfReader(pdfBytes);
        assertTrue(reader.getNumberOfPages() >= 1);
        byte[] page1 = reader.getPageContent(1);
        assertNotNull(page1);
        assertTrue(page1.length > 500);
    }
}









