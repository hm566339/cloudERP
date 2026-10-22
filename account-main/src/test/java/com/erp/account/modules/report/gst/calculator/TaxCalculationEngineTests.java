package com.erp.account.modules.report.gst.calculator;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class TaxCalculationEngineTests {

    private final TaxCalculationEngine engine = new TaxCalculationEngine();

    @Test
    void testZeroRate() {
        BigDecimal taxable = new BigDecimal("1000.00");
        BigDecimal rate = BigDecimal.ZERO;

        assertEquals(0, engine.calculateCGST(taxable, rate).compareTo(BigDecimal.ZERO));
        assertEquals(0, engine.calculateSGST(taxable, rate).compareTo(BigDecimal.ZERO));
        assertEquals(0, engine.calculateIGST(taxable, rate).compareTo(BigDecimal.ZERO));
    }

    @Test
    void testPreciousStonesRatePointTwentyFivePercent() {
        BigDecimal taxable = new BigDecimal("10000.00");
        BigDecimal rate = new BigDecimal("0.25");

        // IGST = 10000 * 0.25 / 100 = 25.0000
        BigDecimal igst = engine.calculateIGST(taxable, rate);
        assertEquals(new BigDecimal("25.0000"), igst);

        // CGST = 10000 * 0.25 / 200 = 12.5000
        BigDecimal cgst = engine.calculateCGST(taxable, rate);
        assertEquals(new BigDecimal("12.5000"), cgst);
    }

    @Test
    void testGoldRateThreePercent() {
        BigDecimal taxable = new BigDecimal("100000.00");
        BigDecimal rate = new BigDecimal("3.00");

        // IGST = 100000 * 3 / 100 = 3000.0000
        BigDecimal igst = engine.calculateIGST(taxable, rate);
        assertEquals(new BigDecimal("3000.0000"), igst);

        // CGST = 100000 * 3 / 200 = 1500.0000
        BigDecimal cgst = engine.calculateCGST(taxable, rate);
        assertEquals(new BigDecimal("1500.0000"), cgst);
    }

    @Test
    void testStandardRateFivePercent() {
        BigDecimal taxable = new BigDecimal("5000.00");
        BigDecimal rate = new BigDecimal("5.00");

        assertEquals(new BigDecimal("250.0000"), engine.calculateIGST(taxable, rate));
        assertEquals(new BigDecimal("125.0000"), engine.calculateCGST(taxable, rate));
        assertEquals(new BigDecimal("125.0000"), engine.calculateSGST(taxable, rate));
    }

    @Test
    void testStandardRateTwelvePercent() {
        BigDecimal taxable = new BigDecimal("1000.00");
        BigDecimal rate = new BigDecimal("12.00");

        assertEquals(new BigDecimal("120.0000"), engine.calculateIGST(taxable, rate));
        assertEquals(new BigDecimal("60.0000"), engine.calculateCGST(taxable, rate));
    }

    @Test
    void testStandardRateEighteenPercent() {
        BigDecimal taxable = new BigDecimal("1000.00");
        BigDecimal rate = new BigDecimal("18.00");

        assertEquals(new BigDecimal("180.0000"), engine.calculateIGST(taxable, rate));
        assertEquals(new BigDecimal("90.0000"), engine.calculateCGST(taxable, rate));
    }

    @Test
    void testLuxuryRateTwentyEightPercentPlusCess() {
        BigDecimal taxable = new BigDecimal("10000.00");
        BigDecimal rate = new BigDecimal("28.00");
        BigDecimal cessRate = new BigDecimal("12.00");

        assertEquals(new BigDecimal("2800.0000"), engine.calculateIGST(taxable, rate));
        assertEquals(new BigDecimal("1400.0000"), engine.calculateCGST(taxable, rate));
        assertEquals(new BigDecimal("1200.0000"), engine.calculateCESS(taxable, cessRate));
    }

    @Test
    void testGstr3bCalculation_NoDoubleDeduction_And_RcmCashLiability() {
        // Output GST ₹1,00,000, eligible ITC ₹60,000, and RCM ₹10,000
        BigDecimal outputGst = new BigDecimal("100000.00");
        BigDecimal utilizedItc = new BigDecimal("60000.00");
        BigDecimal rcm = new BigDecimal("10000.00");
        BigDecimal interest = BigDecimal.ZERO;
        BigDecimal lateFee = BigDecimal.ZERO;

        BigDecimal cashLiability = engine.calculateCashLiability(outputGst, utilizedItc, rcm, interest, lateFee);

        // Forward charge cash = 1,00,000 - 60,000 = 40,000
        // RCM = 10,000 (must be paid in cash, cannot be offset by ITC per Sec 49(4))
        // Net Cash Liability = 40,000 + 10,000 = 50,000
        assertEquals(0, new BigDecimal("50000.00").compareTo(cashLiability));
    }

    @Test
    void testGstr3bCalculation_ExcessItc_RcmStillPayableInCash() {
        // Output ₹40,000, eligible ITC ₹60,000, RCM ₹10,000
        BigDecimal outputGst = new BigDecimal("40000.00");
        BigDecimal utilizedItc = new BigDecimal("40000.00"); // Only up to forward charge
        BigDecimal rcm = new BigDecimal("10000.00");

        BigDecimal cashLiability = engine.calculateCashLiability(outputGst, utilizedItc, rcm, BigDecimal.ZERO, BigDecimal.ZERO);

        // Forward charge payable = 0, RCM must be paid in cash = 10,000
        assertEquals(0, new BigDecimal("10000.00").compareTo(cashLiability));
    }

    @Test
    void testGstr3bCalculation_ZeroTax_And_NullSafety() {
        BigDecimal cashLiability = engine.calculateCashLiability(null, null, null, null, null);
        assertEquals(0, BigDecimal.ZERO.compareTo(cashLiability));
    }

    @Test
    void testGstr3bCalculation_WithInterestAndLateFees() {
        BigDecimal outputGst = new BigDecimal("50000.00");
        BigDecimal itc = new BigDecimal("20000.00");
        BigDecimal rcm = new BigDecimal("5000.00");
        BigDecimal interest = new BigDecimal("1200.00");
        BigDecimal lateFee = new BigDecimal("500.00");

        // Forward: 30,000 + RCM: 5,000 + Interest: 1,200 + Late fee: 500 = 36,700
        BigDecimal cashLiability = engine.calculateCashLiability(outputGst, itc, rcm, interest, lateFee);
        assertEquals(0, new BigDecimal("36700.00").compareTo(cashLiability));
    }

    @Test
    void testGstr3bCalculation_NegativeTaxHandledSafely() {
        BigDecimal outputGst = new BigDecimal("-1000.00");
        BigDecimal itc = new BigDecimal("5000.00");
        BigDecimal rcm = BigDecimal.ZERO;

        BigDecimal cashLiability = engine.calculateCashLiability(outputGst, itc, rcm, BigDecimal.ZERO, BigDecimal.ZERO);
        assertEquals(0, BigDecimal.ZERO.compareTo(cashLiability));
    }

    @Test
    void testRule88a_Output100k_Itc60k_Rcm10k_Verification() {
        // Output GST ₹1,00,000, eligible ITC ₹60,000, and RCM ₹10,000
        TaxCalculationEngine.Rule88aSetoffResult result = engine.calculateRule88aSetoff(
                new BigDecimal("100000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, // Output IGST
                new BigDecimal("60000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,  // Input IGST
                new BigDecimal("10000.00"), BigDecimal.ZERO, BigDecimal.ZERO                     // RCM
        );

        // Verify ITC is utilized exactly once (not deducted twice)
        assertEquals(0, new BigDecimal("60000.00").compareTo(result.getTotalUtilizedItc()));
        // Verify forward-charge cash payable
        assertEquals(0, new BigDecimal("40000.00").compareTo(result.getForwardCashPayable()));
        // Verify RCM is NOT offset by ITC and is paid in cash: 40,000 + 10,000 = 50,000
        assertEquals(0, new BigDecimal("50000.00").compareTo(result.getTotalCashPayable()));
    }

    @Test
    void testRule88a_CessRestriction_CessOnlyOffsetsCess() {
        // Output IGST ₹50,000, Output Cess ₹10,000
        // Input Cess ₹25,000, Input IGST ₹0
        TaxCalculationEngine.Rule88aSetoffResult result = engine.calculateRule88aSetoff(
                new BigDecimal("50000.00"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("10000.00"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("25000.00"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );

        // Cess ITC must NOT offset IGST. Only ₹10,000 Cess is utilized
        assertEquals(0, new BigDecimal("10000.00").compareTo(result.getTotalUtilizedItc()));
        assertEquals(0, new BigDecimal("10000.00").compareTo(result.getUtilizedCess()));
        // Forward cash payable = 50,000 (IGST) + 0 (Cess) = 50,000
        assertEquals(0, new BigDecimal("50000.00").compareTo(result.getForwardCashPayable()));
        assertEquals(0, new BigDecimal("50000.00").compareTo(result.getTotalCashPayable()));
    }

    @Test
    void testRule88a_CgstAndSgstCannotCrossUtilize() {
        // Output CGST ₹0, Output SGST ₹10,000
        // Input CGST ₹10,000, Input SGST ₹0
        TaxCalculationEngine.Rule88aSetoffResult result = engine.calculateRule88aSetoff(
                BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("10000.00"), BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("10000.00"), BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );

        // CGST ITC cannot offset SGST!
        assertEquals(0, BigDecimal.ZERO.compareTo(result.getTotalUtilizedItc()));
        assertEquals(0, new BigDecimal("10000.00").compareTo(result.getForwardCashPayable()));
        assertEquals(0, new BigDecimal("10000.00").compareTo(result.getTotalCashPayable()));
    }

    @Test
    void testRule88a_IgstCoversBothCgstAndSgst() {
        // Output CGST ₹20,000, Output SGST ₹20,000
        // Input IGST ₹35,000
        TaxCalculationEngine.Rule88aSetoffResult result = engine.calculateRule88aSetoff(
                BigDecimal.ZERO, new BigDecimal("20000.00"), new BigDecimal("20000.00"), BigDecimal.ZERO,
                new BigDecimal("35000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );

        // IGST offsets 20,000 CGST, and remaining 15,000 SGST
        assertEquals(0, new BigDecimal("35000.00").compareTo(result.getTotalUtilizedItc()));
        assertEquals(0, BigDecimal.ZERO.compareTo(result.getRemOutputCgst()));
        assertEquals(0, new BigDecimal("5000.00").compareTo(result.getRemOutputSgst()));
        assertEquals(0, new BigDecimal("5000.00").compareTo(result.getForwardCashPayable()));
    }
}
