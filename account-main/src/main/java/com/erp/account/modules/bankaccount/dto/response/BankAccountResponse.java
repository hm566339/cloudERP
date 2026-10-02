package com.erp.account.modules.bankaccount.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.BankAccountType;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccountResponse extends BaseResponseDto  implements Serializable {

    private UUID id;
    private UUID companyId;
    private String bankName;
    private String branchName;
    private String accountNumber;
    private String ifscCode;
    private String upiId;
    private String accountHolderName;
    private String swiftCode;
    private Boolean isPrimary;
    private BankAccountType accountType;
    private BigDecimal openingBalance;
    private UUID glAccountId;
    private String glAccountCode;
    private String glAccountName;
    private UUID ledgerAccountId;
    private String ledgerAccountName;
    private BigDecimal currentBalance;
    private BigDecimal reconciledBalance;
    private Integer transactionCount;
    private Boolean isActive;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
}
