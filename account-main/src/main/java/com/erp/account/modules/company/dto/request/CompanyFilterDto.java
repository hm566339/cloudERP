package com.erp.account.modules.company.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyFilterDto {

    private String searchKey;
    
    private String companyCode;
    
    private String baseCurrency;
    
    private Boolean active;
    
    private Boolean isDeleted;
}
