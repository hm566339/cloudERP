package com.erp.account.modules.gst.dto.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.Data;
import java.util.UUID;

@Data
public class BranchSummaryDto extends BaseResponseDto  {
    private UUID id;
    private String code;
    private String name;
    private Boolean status;
}
