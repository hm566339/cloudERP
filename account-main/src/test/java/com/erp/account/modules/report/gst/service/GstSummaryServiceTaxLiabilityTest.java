package com.erp.account.modules.report.gst.service;

import com.erp.account.modules.report.gst.calculator.TaxCalculationEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests verifying GSTR-3B tax liability calculation and set-off rules in GstSummaryService
 * under CGST Act Section 49 & Rule 88A.
 */
class GstSummaryServiceTaxLiabilityTest {

    private TaxCalculationEngine calculationEngine;
    private GstSummaryService gstSummaryService;

    @BeforeEach
    void setUp() {
        calculationEngine = new TaxCalculationEngine();
        gstSummaryService = new GstSummaryService(calculationEngine);
    }

    @Test
    @DisplayName("Test A: Double ITC deduction eliminated - Output ₹1,00,000, Utilized ₹60,000 -> Forward balance ₹40,000")
    void testScenarioA_DoubleItcDeduction() {
        // Output GST: ₹1,00,000
        BigDecimal outputGst = new BigDecimal("100000.00");
        // Eligible ITC utilized: ₹60,000
        BigDecimal utilizedItc = new BigDecimal("60000.00");
        BigDecimal rcm = BigDecimal.ZERO;
        BigDecimal interest = BigDecimal.ZERO;
        BigDecimal lateFee = BigDecimal.ZERO;

        BigDecimal payable = gstSummaryService.calculateNetTaxLiability(outputGst, utilizedItc, rcm, interest, lateFee);

        // Expected forward-charge balance before other adjustments: ₹40,000
        // (Verifies that availableItc is NOT subtracted on top of utilizedItc)
        assertEquals(0, new BigDecimal("40000.00").compareTo(payable),
                "Forward-charge balance should be ₹40,000 (no double deduction of ITC)");
    }

    @Test
    @DisplayName("Test B: RCM cannot be offset by ITC - Output ₹1,00,000, Utilized ₹60,000, RCM ₹10,000 -> Total ₹50,000")
    void testScenarioB_RcmCannotBeOffsetByItc() {
        BigDecimal outputGst = new BigDecimal("100000.00");
        BigDecimal eligibleItcUtilized = new BigDecimal("60000.00");
        BigDecimal rcmLiability = new BigDecimal("10000.00");
        BigDecimal interest = BigDecimal.ZERO;
        BigDecimal lateFee = BigDecimal.ZERO;

        // Forward charge balance: 1,00,000 - 60,000 = 40,000
        BigDecimal forwardChargeBalance = outputGst.subtract(eligibleItcUtilized).max(BigDecimal.ZERO);
        assertEquals(0, new BigDecimal("40000.00").compareTo(forwardChargeBalance),
                "Expected forward-charge balance: ₹40,000");

        // RCM separate cash liability: 10,000 (must be paid in cash under Section 49(4))
        assertEquals(0, new BigDecimal("10000.00").compareTo(rcmLiability),
                "Expected separate RCM cash liability: ₹10,000");

        // Combined payable before other adjustments: 40,000 + 10,000 = 50,000
        BigDecimal combinedPayable = gstSummaryService.calculateNetTaxLiability(
                outputGst, eligibleItcUtilized, rcmLiability, interest, lateFee);
        assertEquals(0, new BigDecimal("50000.00").compareTo(combinedPayable),
                "Expected combined payable before other adjustments: ₹50,000");
    }

    @Test
    @DisplayName("Test C: ITC exceeds output tax - Output ₹40,000, Available ₹60,000 -> Utilized capped at ₹40,000, no negative payable")
    void testScenarioC_ItcExceedsOutputTax() {
        BigDecimal outputGst = new BigDecimal("40000.00");
        BigDecimal availableItc = new BigDecimal("60000.00");

        // Utilization against output tax cannot exceed output tax (₹40,000)
        BigDecimal utilizedItc = availableItc.min(outputGst);
        assertEquals(0, new BigDecimal("40000.00").compareTo(utilizedItc),
                "ITC utilization against output tax must not exceed ₹40,000");

        // Remaining ITC: ₹20,000 carried forward, not reported as negative liability
        BigDecimal remainingItc = availableItc.subtract(utilizedItc);
        assertEquals(0, new BigDecimal("20000.00").compareTo(remainingItc),
                "Remaining ITC carried forward should be ₹20,000");

        BigDecimal payable = gstSummaryService.calculateNetTaxLiability(
                outputGst, utilizedItc, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        assertEquals(0, BigDecimal.ZERO.compareTo(payable),
                "Payable must be ₹0, not negative");
        assertTrue(payable.compareTo(BigDecimal.ZERO) >= 0,
                "Net tax liability must never be negative");
    }

    @Test
    @DisplayName("Test D: No ITC - Output ₹50,000, Utilized ₹0, RCM ₹5,000 -> Forward ₹50,000, RCM ₹5,000, Total ₹55,000")
    void testScenarioD_NoItc() {
        BigDecimal outputGst = new BigDecimal("50000.00");
        BigDecimal utilizedItc = BigDecimal.ZERO;
        BigDecimal rcm = new BigDecimal("5000.00");

        BigDecimal forwardChargeBalance = outputGst.subtract(utilizedItc).max(BigDecimal.ZERO);
        assertEquals(0, new BigDecimal("50000.00").compareTo(forwardChargeBalance),
                "Expected forward-charge balance: ₹50,000");

        BigDecimal payable = gstSummaryService.calculateNetTaxLiability(
                outputGst, utilizedItc, rcm, BigDecimal.ZERO, BigDecimal.ZERO);
        assertEquals(0, new BigDecimal("55000.00").compareTo(payable),
                "Expected combined cash payable: ₹55,000 (Forward ₹50,000 + RCM ₹5,000)");
    }

    @Test
    @DisplayName("Test E: Monetary precision - Decimals preserved with BigDecimal arbitrary precision")
    void testScenarioE_MonetaryPrecision() {
        BigDecimal outputGst = new BigDecimal("100000.4567");
        BigDecimal utilizedItc = new BigDecimal("60000.2345");
        BigDecimal rcm = new BigDecimal("10000.1111");
        BigDecimal interest = new BigDecimal("250.5050");
        BigDecimal lateFee = new BigDecimal("100.2500");

        BigDecimal payable = gstSummaryService.calculateNetTaxLiability(
                outputGst, utilizedItc, rcm, interest, lateFee);

        // Forward: 100000.4567 - 60000.2345 = 40000.2222
        // Total: 40000.2222 + 10000.1111 + 250.5050 + 100.2500 = 50351.0883
        BigDecimal expected = new BigDecimal("50351.0883");
        assertEquals(0, expected.compareTo(payable),
                "Decimal precision must be preserved without floating-point drift");

        // When rounded to standard 2 decimal places for payment:
        BigDecimal rounded = payable.setScale(2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("50351.09"), rounded);
    }
}
