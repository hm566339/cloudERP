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
}
