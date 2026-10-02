package com.erp.account.modules.gst.dto.profile;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class GstStateRelationsDto {
    private List<CustomerSummaryDto> customers = new ArrayList<>();
    private List<VendorSummaryDto> vendors = new ArrayList<>();
    private List<BranchSummaryDto> branches = new ArrayList<>();
    private List<GSTRegistrationSummaryDto> gstRegistrations = new ArrayList<>();
}
