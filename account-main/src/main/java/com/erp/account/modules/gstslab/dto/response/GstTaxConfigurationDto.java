package com.erp.account.modules.gstslab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GstTaxConfigurationDto {
    private Boolean intraStateTax;
    private Boolean interStateTax;
    private Boolean reverseChargeApplicable;
    private Boolean compositionApplicable;
    private String gstType;
}
