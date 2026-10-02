package com.erp.account.modules.bankaccount.dto.request;

import com.erp.account.enums.BankAccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountFilterDto {

    private UUID companyId;
    private String searchKey;
    private String bankName;
    private String branchName;
    private String accountNumber;
    private String ifscCode;
    private String upiId;
    private List<BankAccountType> accountTypes;
    private BigDecimal minOpeningBalance;
    private BigDecimal maxOpeningBalance;
    private Boolean isActive;
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;

}
