package com.erp.account.modules.accountcategory.dto.request;

import com.erp.account.enums.AccountNature;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountCategoryFilterDto {

    private String searchKey;
    
    private String name;
    
    private UUID companyId;
    private List<String> codes;
    
    private List<AccountNature> natures;
    
    private Boolean isDeleted;
    
    private LocalDate createdFrom;
    private LocalDate createdTo;
    
    private LocalDate updatedFrom;
    private LocalDate updatedTo;
}
