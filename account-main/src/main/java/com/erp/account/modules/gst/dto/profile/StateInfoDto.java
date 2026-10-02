package com.erp.account.modules.gst.dto.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.Data;
import java.util.UUID;

@Data
public class StateInfoDto extends BaseResponseDto  {
    private UUID id;
    private String stateCode;
    private String stateName;
    private String shortName;
    private String isoStateCode;
    private boolean unionTerritory;
    private String capitalCity;
    private String region;
}
