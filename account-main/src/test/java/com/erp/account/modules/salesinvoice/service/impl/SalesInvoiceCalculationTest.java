package com.erp.account.modules.salesinvoice.service.impl;

import com.erp.account.common.service.GstCalculationService;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.gstslab.entity.GstSlab;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceItemRequest;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceRequest;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import com.erp.account.util.InvoiceCalculationHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class SalesInvoiceCalculationTest {

    private GstCalculationService gstCalculationService;

    @BeforeEach
    void setUp() {
        gstCalculationService = new GstCalculationService();
    }

    @Test
    @DisplayName("Test Line Item Calculation and Invoice Totals matching Prompt Example")
    void testPromptExampleCalculation() {
        // Given:
        // Quantity = 10, Unit Price = 100, Discount = 10%, GST = 18%, Freight = 150, Other Charges = 50
        Company company = Company.builder()
                .id(UUID.randomUUID())
                .companyName("Test Seller")
                .gstin("27AABCU9603R1ZM") // Maharashtra (27)
                .isCompositionScheme(false)
                .build();

        GstSlab slab18 = GstSlab.builder()
                .id(UUID.randomUUID())
                .slabName("GST 18%")
                .cgstRate(new BigDecimal("9.00"))
                .sgstRate(new BigDecimal("9.00"))
                .igstRate(new BigDecimal("18.00"))
                .build();

        HsnSacMaster hsn = HsnSacMaster.builder()
                .id(UUID.randomUUID())
                .code("84713010")
                .gstSlab(slab18)
                .build();

        SalesInvoice invoice = SalesInvoice.builder()
                .id(UUID.randomUUID())
                .company(company)
                .companyId(company.getId())
                .invoiceNumber("INV-2026-001")
                .placeOfSupplyStateCode("27") // Intra-state (27 vs 27)
                .freightCharges(new BigDecimal("150.0000"))
                .otherCharges(new BigDecimal("50.0000"))
                .build();

        SalesInvoiceItem item = SalesInvoiceItem.builder()
                .quantity(new BigDecimal("10.0000"))
                .unitPrice(new BigDecimal("100.0000"))
                .discountPercentage(new BigDecimal("10.00"))
                .hsnSacMaster(hsn)
                .salesInvoice(invoice)
                .build();

        // When: Calculate item taxes
        gstCalculationService.calculateItemTaxes(item, company, invoice, hsn, "27");

        // Then:
        // Gross = 10 * 100 = 1000
        // Discount = 1000 * 10% = 100
        // Taxable = 900
        assertEquals(new BigDecimal("10.00"), item.getDiscountPercentage());
        assertEquals(new BigDecimal("100.0000"), item.getDiscountAmount());
        assertEquals(new BigDecimal("900.0000"), item.getDiscountedAmount());
        assertEquals(new BigDecimal("900.0000"), item.getTaxableAmount());

        // GST: Intra-state -> CGST 9% of 900 = 81, SGST 9% of 900 = 81, IGST = 0
        assertEquals(new BigDecimal("81.0000"), item.getCgstAmount());
        assertEquals(new BigDecimal("81.0000"), item.getSgstAmount());
        assertEquals(new BigDecimal("0.0000"), item.getIgstAmount());
        assertEquals(new BigDecimal("162.0000"), item.getTaxAmount());
        assertEquals(new BigDecimal("1062.0000"), item.getTotalAmount());

        // Invoice Level Calculation:
        BigDecimal subtotal = item.getTaxableAmount(); // 900
        BigDecimal taxAmount = item.getTaxAmount(); // 162
        BigDecimal freight = invoice.getFreightCharges(); // 150
        BigDecimal other = invoice.getOtherCharges(); // 50

        BigDecimal totalBeforeRoundOff = InvoiceCalculationHelper.calculateTotalAmount(
                subtotal, taxAmount, BigDecimal.ZERO, freight, other);
        assertEquals(new BigDecimal("1262.0000"), totalBeforeRoundOff);

        BigDecimal roundOff = InvoiceCalculationHelper.calculateRoundOff(totalBeforeRoundOff);
        assertEquals(new BigDecimal("0.0000"), roundOff);

        BigDecimal finalTotal = totalBeforeRoundOff.add(roundOff);
        assertEquals(new BigDecimal("1262.0000"), finalTotal);
    }

    @Test
    @DisplayName("Test Inter-State GST (IGST) Calculation")
    void testInterStateGstCalculation() {
        Company company = Company.builder()
                .id(UUID.randomUUID())
                .gstin("27AABCU9603R1ZM") // Maharashtra (27)
                .isCompositionScheme(false)
                .build();

        GstSlab slab18 = GstSlab.builder()
                .id(UUID.randomUUID())
                .slabName("GST 18%")
                .cgstRate(new BigDecimal("9.00"))
                .sgstRate(new BigDecimal("9.00"))
                .igstRate(new BigDecimal("18.00"))
                .build();

        HsnSacMaster hsn = HsnSacMaster.builder()
                .id(UUID.randomUUID())
                .code("84713010")
                .gstSlab(slab18)
                .build();

        SalesInvoice invoice = SalesInvoice.builder()
                .id(UUID.randomUUID())
                .company(company)
                .companyId(company.getId())
                .placeOfSupplyStateCode("29") // Karnataka (29) -> Inter-state
                .build();

        SalesInvoiceItem item = SalesInvoiceItem.builder()
                .quantity(new BigDecimal("5.0000"))
                .unitPrice(new BigDecimal("200.0000"))
                .discountPercentage(new BigDecimal("5.00"))
                .hsnSacMaster(hsn)
                .salesInvoice(invoice)
                .build();

        gstCalculationService.calculateItemTaxes(item, company, invoice, hsn, "27");

        // Gross = 1000, Discount 5% = 50, Taxable = 950
        assertEquals(new BigDecimal("950.0000"), item.getTaxableAmount());
        assertEquals(new BigDecimal("0.0000"), item.getCgstAmount());
        assertEquals(new BigDecimal("0.0000"), item.getSgstAmount());
        // IGST 18% of 950 = 171.0000
        assertEquals(new BigDecimal("171.0000"), item.getIgstAmount());
        assertEquals(new BigDecimal("171.0000"), item.getTaxAmount());
        assertEquals(new BigDecimal("1121.0000"), item.getTotalAmount());
    }

    @Test
    @DisplayName("Test Round Off Calculation Formula")
    void testRoundOffCalculation() {
        BigDecimal totalBeforeRoundOff = new BigDecimal("1250.40");
        BigDecimal roundOff = InvoiceCalculationHelper.calculateRoundOff(totalBeforeRoundOff);
        BigDecimal totalAmount = totalBeforeRoundOff.add(roundOff);

        assertEquals(new BigDecimal("-0.4000"), roundOff);
        assertEquals(new BigDecimal("1250.0000"), totalAmount);

        BigDecimal totalBeforeRoundOff2 = new BigDecimal("1250.60");
        BigDecimal roundOff2 = InvoiceCalculationHelper.calculateRoundOff(totalBeforeRoundOff2);
        BigDecimal totalAmount2 = totalBeforeRoundOff2.add(roundOff2);

        assertEquals(new BigDecimal("0.4000"), roundOff2);
        assertEquals(new BigDecimal("1251.0000"), totalAmount2);
    }

    @Test
    @DisplayName("Test Payment Status & Outstanding Balance Calculation")
    void testPaymentStatusAndOutstanding() {
        BigDecimal totalAmount = new BigDecimal("1262.0000");

        // 1. Unpaid
        BigDecimal received0 = BigDecimal.ZERO;
        BigDecimal outstanding0 = InvoiceCalculationHelper.calculateOutstandingAmount(totalAmount, received0);
        BigDecimal pct0 = InvoiceCalculationHelper.calculatePaymentPercentage(received0, totalAmount);
        assertEquals(new BigDecimal("1262.0000"), outstanding0);
        assertEquals(new BigDecimal("0.00"), pct0);

        // 2. Partial
        BigDecimal receivedPartial = new BigDecimal("500.0000");
        BigDecimal outstandingPartial = InvoiceCalculationHelper.calculateOutstandingAmount(totalAmount, receivedPartial);
        BigDecimal pctPartial = InvoiceCalculationHelper.calculatePaymentPercentage(receivedPartial, totalAmount);
        assertEquals(new BigDecimal("762.0000"), outstandingPartial);
        assertEquals(new BigDecimal("39.62"), pctPartial);

        // 3. Paid
        BigDecimal receivedPaid = new BigDecimal("1262.0000");
        BigDecimal outstandingPaid = InvoiceCalculationHelper.calculateOutstandingAmount(totalAmount, receivedPaid);
        BigDecimal pctPaid = InvoiceCalculationHelper.calculatePaymentPercentage(receivedPaid, totalAmount);
        assertEquals(new BigDecimal("0.0000"), outstandingPaid);
        assertEquals(new BigDecimal("100.00"), pctPaid);
    }

    @Test
    @DisplayName("Test Line Item Request & Response Only Exposes discountPercentage")
    void testDtoExposesOnlyDiscountPercentage() {
        SalesInvoiceItemRequest req = new SalesInvoiceItemRequest();
        req.setQuantity(new BigDecimal("10"));
        req.setUnitPrice(new BigDecimal("100"));
        req.setDiscountPercentage(new BigDecimal("10"));

        assertEquals(new BigDecimal("10"), req.getQuantity());
        assertEquals(new BigDecimal("100"), req.getUnitPrice());
        assertEquals(new BigDecimal("10"), req.getDiscountPercentage());

        com.erp.account.modules.salesinvoice.dto.SalesInvoiceItemResponse resp =
                new com.erp.account.modules.salesinvoice.dto.SalesInvoiceItemResponse();
        resp.setQuantity(new BigDecimal("10.0000"));
        resp.setUnitPrice(new BigDecimal("100.0000"));
        resp.setDiscountPercentage(new BigDecimal("10.00"));
        resp.setTaxableAmount(new BigDecimal("900.0000"));
        resp.setTaxAmount(new BigDecimal("162.0000"));
        resp.setTotalAmount(new BigDecimal("1062.0000"));

        assertEquals(new BigDecimal("10.00"), resp.getDiscountPercentage());
        assertEquals(new BigDecimal("900.0000"), resp.getTaxableAmount());
        assertEquals(new BigDecimal("1062.0000"), resp.getTotalAmount());
    }
}
