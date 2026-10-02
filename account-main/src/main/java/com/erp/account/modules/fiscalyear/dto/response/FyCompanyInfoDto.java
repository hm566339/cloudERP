package com.erp.account.modules.fiscalyear.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FyCompanyInfoDto {
    private UUID companyId;
    private String companyName;
    private String companyCode;
    private String gstin;
    private String pan;
    private String currency;
    private String financialYearFormat;
}
