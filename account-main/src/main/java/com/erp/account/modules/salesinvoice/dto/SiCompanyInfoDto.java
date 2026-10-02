package com.erp.account.modules.salesinvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiCompanyInfoDto {
    private UUID companyId;
    private String companyName;
    private String companyCode;
    private String gstin;
    private String pan;
    private String address;
    private String contactDetails;
    private String baseCurrency;
}
