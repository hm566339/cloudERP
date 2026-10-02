package com.erp.account.modules.gst.dto.profile;

import lombok.Data;

@Data
public class AddressMetadataDto {
    private String capitalCity;
    private String region;
    private String timeZone;
    private String currencyCode;
    private String currencyName;
}
