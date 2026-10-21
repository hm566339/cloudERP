package com.erp.account.modules.report.gst.calculator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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

    /**
     * Calculates net cash liability payable to the government under CGST Act Section 49 & Rule 88A:
     * - Forward-charge output tax can be offset by utilized eligible ITC.
     * - Reverse-charge (RCM) liability CANNOT be offset using ITC and must be discharged 100% in cash (Section 49(4)).
     * - Applicable interest and late fees must be paid in cash.
     */
    public BigDecimal calculateCashLiability(BigDecimal forwardChargeTax, BigDecimal utilizedItc,
                                             BigDecimal reverseCharge, BigDecimal interest, BigDecimal lateFee) {
        BigDecimal output = forwardChargeTax != null ? forwardChargeTax : BigDecimal.ZERO;
        BigDecimal itc = utilizedItc != null ? utilizedItc : BigDecimal.ZERO;
        BigDecimal rcm = reverseCharge != null ? reverseCharge : BigDecimal.ZERO;
        BigDecimal intAmt = interest != null ? interest : BigDecimal.ZERO;
        BigDecimal fee = lateFee != null ? lateFee : BigDecimal.ZERO;

        BigDecimal forwardChargePayable = output.subtract(itc).max(BigDecimal.ZERO);
        return forwardChargePayable.add(rcm).add(intAmt).add(fee).max(BigDecimal.ZERO);
    }
    
    public BigDecimal calculateReverseCharge(BigDecimal taxableValue, BigDecimal rate) {
        return calculateIGST(taxableValue, rate); // Simplified for calculation engine
    }

    public BigDecimal calculateAvailableITC(BigDecimal cgst, BigDecimal sgst, BigDecimal igst) {
        return (cgst != null ? cgst : BigDecimal.ZERO)
               .add(sgst != null ? sgst : BigDecimal.ZERO)
               .add(igst != null ? igst : BigDecimal.ZERO);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Rule88aSetoffResult {
        private BigDecimal utilizedIgst;
        private BigDecimal utilizedCgst;
        private BigDecimal utilizedSgst;
        private BigDecimal utilizedCess;
        private BigDecimal totalUtilizedItc;
        private BigDecimal remOutputIgst;
        private BigDecimal remOutputCgst;
        private BigDecimal remOutputSgst;
        private BigDecimal remOutputCess;
        private BigDecimal forwardCashPayable;
        private BigDecimal totalCashPayable;
    }

    /**
     * Executes component-wise GST set-off under GST Rule 88A:
     * 1. Cess ITC can ONLY be set off against Cess output liability.
     * 2. IGST ITC is utilized against IGST, then CGST, then SGST.
     * 3. CGST ITC is utilized against CGST, then IGST (never SGST).
     * 4. SGST ITC is utilized against SGST, then IGST (never CGST).
     * 5. RCM liability cannot be offset by ITC and must be paid 100% in cash (Section 49(4)).
     */
    public Rule88aSetoffResult calculateRule88aSetoff(
            BigDecimal outputIgst, BigDecimal outputCgst, BigDecimal outputSgst, BigDecimal outputCess,
            BigDecimal inputIgst, BigDecimal inputCgst, BigDecimal inputSgst, BigDecimal inputCess,
            BigDecimal rcm, BigDecimal interest, BigDecimal lateFee) {

        BigDecimal oIgst = outputIgst != null ? outputIgst.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal oCgst = outputCgst != null ? outputCgst.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal oSgst = outputSgst != null ? outputSgst.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal oCess = outputCess != null ? outputCess.max(BigDecimal.ZERO) : BigDecimal.ZERO;

        BigDecimal iIgst = inputIgst != null ? inputIgst.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal iCgst = inputCgst != null ? inputCgst.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal iSgst = inputSgst != null ? inputSgst.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal iCess = inputCess != null ? inputCess.max(BigDecimal.ZERO) : BigDecimal.ZERO;

        BigDecimal rcmVal = rcm != null ? rcm.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal intVal = interest != null ? interest.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal feeVal = lateFee != null ? lateFee.max(BigDecimal.ZERO) : BigDecimal.ZERO;

        // 1. Cess ITC can ONLY be set off against Cess output liability
        BigDecimal utilizedCess = iCess.min(oCess);
        BigDecimal remOutputCess = oCess.subtract(utilizedCess);

        // 2. IGST credit utilized against IGST, then CGST, then SGST
        BigDecimal igstUsedForIgst = iIgst.min(oIgst);
        BigDecimal remOutputIgst = oIgst.subtract(igstUsedForIgst);
        BigDecimal remInputIgst = iIgst.subtract(igstUsedForIgst);

        BigDecimal igstUsedForCgst = remInputIgst.min(oCgst);
        BigDecimal remOutputCgst = oCgst.subtract(igstUsedForCgst);
        remInputIgst = remInputIgst.subtract(igstUsedForCgst);

        BigDecimal igstUsedForSgst = remInputIgst.min(oSgst);
        BigDecimal remOutputSgst = oSgst.subtract(igstUsedForSgst);

        // 3. CGST credit utilized against CGST, then IGST (never against SGST)
        BigDecimal cgstUsedForCgst = iCgst.min(remOutputCgst);
        remOutputCgst = remOutputCgst.subtract(cgstUsedForCgst);
        BigDecimal remInputCgst = iCgst.subtract(cgstUsedForCgst);

        BigDecimal cgstUsedForIgst = remInputCgst.min(remOutputIgst);
        remOutputIgst = remOutputIgst.subtract(cgstUsedForIgst);

        // 4. SGST credit utilized against SGST, then IGST (never against CGST)
        BigDecimal sgstUsedForSgst = iSgst.min(remOutputSgst);
        remOutputSgst = remOutputSgst.subtract(sgstUsedForSgst);
        BigDecimal remInputSgst = iSgst.subtract(sgstUsedForSgst);

        BigDecimal sgstUsedForIgst = remInputSgst.min(remOutputIgst);
        remOutputIgst = remOutputIgst.subtract(sgstUsedForIgst);

        BigDecimal totalUtilized = utilizedCess
                .add(igstUsedForIgst).add(igstUsedForCgst).add(igstUsedForSgst)
                .add(cgstUsedForCgst).add(cgstUsedForIgst)
                .add(sgstUsedForSgst).add(sgstUsedForIgst);

        BigDecimal forwardCash = remOutputIgst.add(remOutputCgst).add(remOutputSgst).add(remOutputCess).max(BigDecimal.ZERO);
        BigDecimal totalCash = forwardCash.add(rcmVal).add(intVal).add(feeVal);

        return Rule88aSetoffResult.builder()
                .utilizedIgst(igstUsedForIgst.add(igstUsedForCgst).add(igstUsedForSgst))
                .utilizedCgst(cgstUsedForCgst.add(cgstUsedForIgst))
                .utilizedSgst(sgstUsedForSgst.add(sgstUsedForIgst))
                .utilizedCess(utilizedCess)
                .totalUtilizedItc(totalUtilized)
                .remOutputIgst(remOutputIgst)
                .remOutputCgst(remOutputCgst)
                .remOutputSgst(remOutputSgst)
                .remOutputCess(remOutputCess)
                .forwardCashPayable(forwardCash)
                .totalCashPayable(totalCash)
                .build();
    }
}
