package com.erp.account.modules.company.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class CompanyResponse extends BaseResponseDto  {

    private UUID id;

    private String companyName;

    private String gstin;

    private String companyCode;

    private String email;

    private String phone;

    private String addressLine1;

    private String addressLine2;

    private String city;

    private String state;

    private String country;

    private String postalCode;

    private String companyType;

    private String legalName;

    private String logoUrl;

    private String pan;

    private String website;
    private Boolean active;

    private String baseCurrency;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
