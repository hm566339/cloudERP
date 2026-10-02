package com.erp.account.util;

import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponse;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.hsnsacmaster.mapper.HsnSacMasterMapper;


public final class HsnSacReportHelper {

    private HsnSacReportHelper() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static HsnSacMasterResponse buildReportResponse(HsnSacMaster entity,
                                                           long invoiceUsageCount,
                                                           long itemMappingCount,
                                                           long taxTransactionCount) {
        HsnSacMasterResponse response = HsnSacMasterMapperHolder.MAPPER.entityToResponse(entity);
        response.setInvoiceUsageCount(invoiceUsageCount);
        response.setItemMappingCount(itemMappingCount);
        response.setTaxTransactionCount(taxTransactionCount);
        return response;
    }

    private static class HsnSacMasterMapperHolder {
        private static final com.erp.account.modules.hsnsacmaster.mapper.HsnSacMasterMapper MAPPER = org.mapstruct.factory.Mappers.getMapper(com.erp.account.modules.hsnsacmaster.mapper.HsnSacMasterMapper.class);
    }
}
