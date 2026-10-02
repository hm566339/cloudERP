package com.erp.account.modules.gst.dto.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.Data;
import java.util.UUID;

@Data
public class CountryInfoDto extends BaseResponseDto  {
    private UUID id;
    private String countryCode;
    private String countryName;
    private String isoCountryCode;
}
