package com.erp.account.modules.ledger.dto.request;

import com.erp.account.enums.AccountNature;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartOfAccountFilterDto {

    private String searchKey;
    
    private UUID groupId;
    private String groupName;

    private UUID companyId;
    
    private UUID parentAccountId;
    private String parentAccountCode;
    
    private String accountCode;
    private String accountName;
    
    private List<AccountNature> accountTypes;
    private String categoryCode;
    private List<String> categoryCodes;
    private String groupCode;
    private List<String> groupCodes;
    
    private Boolean postingAllowed;
    private Boolean isActive;
    
    private BigDecimal minOpeningBalance;
    private BigDecimal maxOpeningBalance;
    
    private LocalDate createdFrom;
    private LocalDate createdTo;
    
    private LocalDate updatedFrom;
    private LocalDate updatedTo;
}
