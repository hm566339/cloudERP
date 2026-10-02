package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyInfoDto implements Serializable {
    private UUID companyId;
    private String companyCode;
    private String companyName;
    private String baseCurrency;
}
