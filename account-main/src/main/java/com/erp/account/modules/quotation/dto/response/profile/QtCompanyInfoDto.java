package com.erp.account.modules.quotation.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QtCompanyInfoDto {
    private java.util.UUID companyId;
    private String companyName;
    private String legalName;
    private String companyCode;
    private String gstin;
    private String pan;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String email;
    private String phone;
    private String website;
    private String logoUrl;
    private String companyType;
}
