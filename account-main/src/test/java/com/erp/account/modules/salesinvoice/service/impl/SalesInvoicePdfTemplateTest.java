package com.erp.account.modules.salesinvoice.service.impl;

import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertTrue;

class SalesInvoicePdfTemplateTest {

    private TemplateEngine templateEngine;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver templateResolver = new ClassLoaderTemplateResolver();
        templateResolver.setPrefix("templates/");
        templateResolver.setSuffix(".html");
        templateResolver.setTemplateMode(TemplateMode.HTML);
        templateResolver.setCharacterEncoding("UTF-8");

        templateEngine = new TemplateEngine();
        templateEngine.setTemplateResolver(templateResolver);
    }

    private String processTemplate(SalesInvoice invoice) {
        Context context = new Context();
        context.setVariable("invoice", invoice);
        context.setVariable("company", new Company());
        context.setVariable("customer", new Customer());
        return templateEngine.process("invoice-template", context);
    }

    @Test
    void testPdfTemplateWithFreightAndZeroRoundOff() {
        SalesInvoice invoice = new SalesInvoice();
        invoice.setSubtotal(new BigDecimal("45000.00"));
        invoice.setTaxAmount(new BigDecimal("8100.00"));
        invoice.setFreightCharges(new BigDecimal("500.00"));
        invoice.setTotalBeforeRoundOff(new BigDecimal("53600.00"));
        invoice.setRoundOff(new BigDecimal("0.00"));
        invoice.setTotalAmount(new BigDecimal("53600.00"));

        String html = processTemplate(invoice);

        assertTrue(html.contains("45,000.00"), "Subtotal should be formatted");
        assertTrue(html.contains("8,100.00"), "Tax should be formatted");
        assertTrue(html.contains("500.00"), "Freight should be formatted");
        assertTrue(html.contains("53,600.00"), "Total before round off and grand total should be formatted");
        assertTrue(html.contains("0.00"), "Round off should be 0.00");
    }

    @Test
    void testPdfTemplateWithFreightAndNegativeRoundOff() {
        SalesInvoice invoice = new SalesInvoice();
        invoice.setSubtotal(new BigDecimal("45000.00"));
        invoice.setTaxAmount(new BigDecimal("8100.00"));
        invoice.setFreightCharges(new BigDecimal("150.50"));
        invoice.setTotalBeforeRoundOff(new BigDecimal("53250.50"));
        invoice.setRoundOff(new BigDecimal("-0.50"));
        invoice.setTotalAmount(new BigDecimal("53250.00"));

        String html = processTemplate(invoice);

        assertTrue(html.contains("150.50"), "Freight should be formatted");
        assertTrue(html.contains("53,250.50"), "Total before round off should be formatted");
        assertTrue(html.contains("-0.50"), "Negative round off should be formatted");
        assertTrue(html.contains("53,250.00"), "Grand total should be formatted");
    }

    @Test
    void testPdfTemplateWithZeroFreightAndZeroRoundOff() {
        SalesInvoice invoice = new SalesInvoice();
        invoice.setSubtotal(new BigDecimal("45000.00"));
        invoice.setTaxAmount(new BigDecimal("8100.00"));
        invoice.setFreightCharges(new BigDecimal("0.00"));
        invoice.setTotalBeforeRoundOff(new BigDecimal("53100.00"));
        invoice.setRoundOff(new BigDecimal("0.00"));
        invoice.setTotalAmount(new BigDecimal("53100.00"));

        String html = processTemplate(invoice);

        assertTrue(html.contains("0.00"), "Zero values should be formatted");
        assertTrue(html.contains("53,100.00"), "Totals should be formatted");
    }

    @Test
    void testPdfTemplateWithPositiveRoundOff() {
        SalesInvoice invoice = new SalesInvoice();
        invoice.setSubtotal(new BigDecimal("45000.00"));
        invoice.setTaxAmount(new BigDecimal("8100.00"));
        invoice.setFreightCharges(new BigDecimal("0.00"));
        invoice.setTotalBeforeRoundOff(new BigDecimal("53100.40"));
        invoice.setRoundOff(new BigDecimal("0.60"));
        invoice.setTotalAmount(new BigDecimal("53101.00"));

        String html = processTemplate(invoice);

        assertTrue(html.contains("53,100.40"), "Total before round off should be formatted");
        assertTrue(html.contains("0.60"), "Positive round off should be formatted");
        assertTrue(html.contains("53,101.00"), "Grand total should be formatted");
    }

    @Test
    void testPdfTemplateWithNullFields() {
        SalesInvoice invoice = new SalesInvoice();
        invoice.setSubtotal(new BigDecimal("45000.00"));
        invoice.setTaxAmount(new BigDecimal("8100.00"));
        invoice.setTotalAmount(new BigDecimal("53100.00"));
        // freightCharges, totalBeforeRoundOff, roundOff are null

        String html = processTemplate(invoice);

        // Fallbacks: freight=0.00, totalBeforeRoundOff=totalAmount, roundOff=0.00
        assertTrue(html.contains("0.00"), "Null values should fallback to 0.00");
        assertTrue(html.contains("53,100.00"), "Total before round off should fallback to grand total");
    }
}
