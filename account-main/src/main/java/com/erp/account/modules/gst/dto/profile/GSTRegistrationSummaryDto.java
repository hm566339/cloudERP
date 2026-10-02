package com.erp.account.modules.gst.dto.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.Data;
import java.util.UUID;

@Data
public class GSTRegistrationSummaryDto extends BaseResponseDto  {
    private UUID id;
    private String gstin;
    private String legalName;
}
