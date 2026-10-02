package com.erp.account.modules.company.dto.clientdto;


import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@RequiredArgsConstructor
public class CompanyResponseClient {

    private UUID id;
    private String companyCode;
    private String companyName;
    private String legalName;
    private String companyType;
    private String gstin;
    private String pan;
    private String email;
    private String phone;
    private String website;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String logoUrl;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}