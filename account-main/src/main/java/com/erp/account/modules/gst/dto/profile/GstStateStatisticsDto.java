package com.erp.account.modules.gst.dto.profile;

import lombok.Data;

@Data
public class GstStateStatisticsDto {
    private Long customerCount;
    private Long vendorCount;
    private Long branchCount;
    private Long gstRegistrationCount;
}
