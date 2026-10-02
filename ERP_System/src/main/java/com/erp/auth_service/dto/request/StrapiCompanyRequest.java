package com.erp.auth_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StrapiCompanyRequest {

    private CompanyData data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyData {

        private String companyCode;
        private String companySecret;
        private String companyName;
        private String gstin;
        private String baseCurrency;
        private String email;
        private String phone;
        private String address;
        private Boolean active;
    }
}