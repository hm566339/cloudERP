package com.erp.auth_service.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationCompanyResponse {
    private UUID id;
    private String companyCode;
    private String companyName;
    private String legalName;
    private String companyType;
    private Boolean active;
    private String baseCurrency;
    private String email;
    private String phone;
    private String city;
    private String state;
    private String country;
    private String gstin;
    private String pan;
    private String logoUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

