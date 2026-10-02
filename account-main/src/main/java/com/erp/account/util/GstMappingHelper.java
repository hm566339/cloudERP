package com.erp.account.util;

import com.erp.account.modules.gstslab.entity.GstSlab;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.common.exception.InvalidGstSlabException;

public final class GstMappingHelper {

    private GstMappingHelper() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static GstSlab resolveGstSlab(HsnSacMaster hsnSacMaster) {
        if (hsnSacMaster == null || hsnSacMaster.getGstSlab() == null) {
            throw new InvalidGstSlabException("GST slab mapping is missing for HSN/SAC");
        }
        return hsnSacMaster.getGstSlab();
    }


}
