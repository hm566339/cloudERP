package com.erp.account.modules.accountgroup.dto.request;

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
public class AccountGroupFilterDto {

    private String searchKey;
    
    private String name;

    private UUID companyId;
    
    private UUID categoryId;
    private UUID parentGroupId;
    
    private List<String> categoryTypes;
    
    private Boolean isDeleted;
    
    private LocalDate createdFrom;
    private LocalDate createdTo;
    
    private LocalDate updatedFrom;
    private LocalDate updatedTo;
}
