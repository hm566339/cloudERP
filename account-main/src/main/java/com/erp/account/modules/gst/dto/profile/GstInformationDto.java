package com.erp.account.modules.gst.dto.profile;

import lombok.Data;

@Data
public class GstInformationDto {
    private String gstStateCode;
    private String gstStateName;
    private boolean registrationAllowed;
    private String defaultPlaceOfSupply;
    private boolean reverseChargeApplicable;
}
