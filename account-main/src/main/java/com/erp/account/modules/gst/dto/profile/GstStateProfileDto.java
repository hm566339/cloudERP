package com.erp.account.modules.gst.dto.profile;

import lombok.Data;

@Data
public class GstStateProfileDto {
    private StateInfoDto state;
    private CountryInfoDto country;
    private GstInformationDto gstInformation;
    private AddressMetadataDto addressMetadata;
    private AuditInfoDto audit;
}
