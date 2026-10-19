package com.erp.manufacturing.security.dto.sso;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CompanyResponse {

    private UUID id;
    private String companyCode;
    private String companyName;
    private String legalName;
    private String baseCurrency;
    private Boolean active;
}
