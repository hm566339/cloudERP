package com.erp.account.modules.bankaccount.dto.response.profile;

import com.erp.account.enums.BankAccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountMasterDto {
    private UUID bankAccountId;
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
    private Boolean isActive;
}
