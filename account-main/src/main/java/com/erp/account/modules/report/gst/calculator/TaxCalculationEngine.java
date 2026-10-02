package com.erp.account.modules.report.gst.calculator;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Enterprise Tax Calculation Engine for GST Rules in India
 */
@Slf4j
@Component
public class TaxCalculationEngine {

    public BigDecimal calculateCGST(BigDecimal taxableValue, BigDecimal rate) {
        if (taxableValue == null || rate == null || rate.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return taxableValue.multiply(rate).divide(new BigDecimal("200"), 4, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateSGST(BigDecimal taxableValue, BigDecimal rate) {
        // SGST is same as CGST for intrastate
        return calculateCGST(taxableValue, rate);
    }

    public BigDecimal calculateIGST(BigDecimal taxableValue, BigDecimal rate) {
        if (taxableValue == null || rate == null || rate.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return taxableValue.multiply(rate).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateCESS(BigDecimal taxableValue, BigDecimal cessRate) {
        if (taxableValue == null || cessRate == null || cessRate.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return taxableValue.multiply(cessRate).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateNetLiability(BigDecimal outputTax, BigDecimal inputTaxCredit) {
        if (outputTax == null) return BigDecimal.ZERO;
        if (inputTaxCredit == null) return outputTax;
        
        BigDecimal net = outputTax.subtract(inputTaxCredit);
        return net.compareTo(BigDecimal.ZERO) > 0 ? net : BigDecimal.ZERO;
    }
    
    public BigDecimal calculateReverseCharge(BigDecimal taxableValue, BigDecimal rate) {
        return calculateIGST(taxableValue, rate); // Simplified for calculation engine
    }

    public BigDecimal calculateAvailableITC(BigDecimal cgst, BigDecimal sgst, BigDecimal igst) {
        return (cgst != null ? cgst : BigDecimal.ZERO)
               .add(sgst != null ? sgst : BigDecimal.ZERO)
               .add(igst != null ? igst : BigDecimal.ZERO);
    }
}
