package com.erp.account.modules.gst.service;

import com.erp.account.modules.gst.entity.GstInputTax;
import com.erp.account.modules.gst.entity.GstOutputTax;
import com.erp.account.modules.gst.enums.GstRegistrationType;
import com.erp.account.modules.gst.enums.GstSupplyType;

import java.math.BigDecimal;

public interface GstCalculationService {
    
    /**
     * Calculates Output Tax according to Indian GST Rules (1-10)
     */
    GstOutputTax calculateOutputTax(
            BigDecimal taxableValue,
            BigDecimal gstRate,
            BigDecimal cessRate,
            GstSupplyType supplyType,
            boolean isReverseCharge,
            boolean isNilRated,
            boolean isExempt,
            boolean isNonGst
    );
    
    /**
     * Calculates Input Tax according to Indian GST Rules (1-10)
     */
    GstInputTax calculateInputTax(
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
    );
}
