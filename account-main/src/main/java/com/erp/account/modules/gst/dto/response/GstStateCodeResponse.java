package com.erp.account.modules.gst.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GstStateCodeResponse extends BaseResponseDto  {
    private UUID id;
    private String stateCode;
    private String stateName;
    private String displayName;
    
    @Builder.Default
    private String countryCode = "IN";
    
    private boolean isUnionTerritory;
    
    @Builder.Default
    private boolean active = true;
}
