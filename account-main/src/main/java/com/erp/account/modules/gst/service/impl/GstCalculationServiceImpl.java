package com.erp.account.modules.gst.service.impl;

import com.erp.account.modules.gst.entity.GstInputTax;
import com.erp.account.modules.gst.entity.GstOutputTax;
import com.erp.account.modules.gst.enums.GstRegistrationType;
import com.erp.account.modules.gst.enums.GstSupplyType;
import com.erp.account.modules.gst.service.GstCalculationService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class GstCalculationServiceImpl implements GstCalculationService {

    @Override
    public GstOutputTax calculateOutputTax(
            BigDecimal taxableValue,
            BigDecimal gstRate,
            BigDecimal cessRate,
            GstSupplyType supplyType,
            boolean isReverseCharge,
            boolean isNilRated,
            boolean isExempt,
            boolean isNonGst
    ) {
        GstOutputTax outputTax = new GstOutputTax();
        outputTax.setTaxableValue(taxableValue);
        outputTax.setGstRate(gstRate);
        outputTax.setSupplyType(supplyType);
        outputTax.setReverseCharge(isReverseCharge);

        // Rule 6, 7, 8: Nil Rated, Exempt, Non GST
        if (isNilRated || isExempt || isNonGst) {
            outputTax.setCgstAmount(BigDecimal.ZERO);
            outputTax.setSgstAmount(BigDecimal.ZERO);
            outputTax.setIgstAmount(BigDecimal.ZERO);
            outputTax.setCessAmount(BigDecimal.ZERO);
            outputTax.setTotalTaxAmount(BigDecimal.ZERO);
            return outputTax;
        }

        // Rule 3, 4: Export & SEZ
        if (supplyType == GstSupplyType.EXPORT || supplyType == GstSupplyType.SEZ_WITH_PAYMENT || supplyType == GstSupplyType.SEZ_WITHOUT_PAYMENT) {
            // Treat as zero-rated by default unless with payment
            if (supplyType != GstSupplyType.SEZ_WITH_PAYMENT && supplyType != GstSupplyType.EXPORT_WITH_PAYMENT) {
                outputTax.setCgstAmount(BigDecimal.ZERO);
                outputTax.setSgstAmount(BigDecimal.ZERO);
                outputTax.setIgstAmount(BigDecimal.ZERO);
                outputTax.setCessAmount(BigDecimal.ZERO);
                outputTax.setTotalTaxAmount(BigDecimal.ZERO);
                return outputTax;
            } else {
                // If with payment, Export/SEZ is IGST
                supplyType = GstSupplyType.INTER_STATE; 
            }
        }

        BigDecimal gstAmount = taxableValue.multiply(gstRate).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        BigDecimal cessAmount = cessRate != null && cessRate.compareTo(BigDecimal.ZERO) > 0 ? 
                taxableValue.multiply(cessRate).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        outputTax.setCessAmount(cessAmount);

        // Rule 1: Same State (INTRA_STATE)
        if (supplyType == GstSupplyType.INTRA_STATE) {
            BigDecimal halfGst = gstAmount.divide(new BigDecimal("2"), 4, RoundingMode.HALF_UP);
            outputTax.setCgstAmount(halfGst);
            outputTax.setSgstAmount(halfGst);
            outputTax.setIgstAmount(BigDecimal.ZERO);
        } 
        // Rule 2: Different State (INTER_STATE)
        else {
            outputTax.setCgstAmount(BigDecimal.ZERO);
            outputTax.setSgstAmount(BigDecimal.ZERO);
            outputTax.setIgstAmount(gstAmount);
        }

        BigDecimal totalTax = outputTax.getCgstAmount().add(outputTax.getSgstAmount()).add(outputTax.getIgstAmount()).add(outputTax.getCessAmount());
        outputTax.setTotalTaxAmount(totalTax);

        return outputTax;
    }

    @Override
    public GstInputTax calculateInputTax(
            BigDecimal taxableValue,
            BigDecimal gstRate,
            BigDecimal cessRate,
            GstSupplyType supplyType,
            GstRegistrationType purchaserRegistrationType,
            boolean isReverseCharge,
            boolean isNilRated,
            boolean isExempt,
            boolean isNonGst,
            boolean isBlockedItc
    ) {
        GstInputTax inputTax = new GstInputTax();
        inputTax.setTaxableValue(taxableValue);
        inputTax.setGstRate(gstRate);
        inputTax.setSupplyType(supplyType);
        inputTax.setReverseCharge(isReverseCharge);

        // Rule 9: Composition Dealer -> No ITC Allowed
        if (purchaserRegistrationType == GstRegistrationType.COMPOSITION || isBlockedItc) {
            inputTax.setEligibleForItc(false);
        } else {
            inputTax.setEligibleForItc(true);
        }

        // Calculation logic is similar for taxes
        if (isNilRated || isExempt || isNonGst || supplyType == GstSupplyType.EXPORT_WITHOUT_PAYMENT) {
            inputTax.setCgstAmount(BigDecimal.ZERO);
            inputTax.setSgstAmount(BigDecimal.ZERO);
            inputTax.setIgstAmount(BigDecimal.ZERO);
            inputTax.setCessAmount(BigDecimal.ZERO);
            inputTax.setEligibleForItc(false); // No tax = No ITC
            return inputTax;
        }

        BigDecimal gstAmount = taxableValue.multiply(gstRate).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        BigDecimal cessAmt = cessRate != null && cessRate.compareTo(BigDecimal.ZERO) > 0 ? 
                taxableValue.multiply(cessRate).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        inputTax.setCessAmount(cessAmt);

        if (supplyType == GstSupplyType.INTRA_STATE) {
            BigDecimal halfGst = gstAmount.divide(new BigDecimal("2"), 4, RoundingMode.HALF_UP);
            inputTax.setCgstAmount(halfGst);
            inputTax.setSgstAmount(halfGst);
            inputTax.setIgstAmount(BigDecimal.ZERO);
        } else {
            inputTax.setCgstAmount(BigDecimal.ZERO);
            inputTax.setSgstAmount(BigDecimal.ZERO);
            inputTax.setIgstAmount(gstAmount);
        }

        return inputTax;
    }
}
