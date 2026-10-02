package com.erp.account.modules.bankaccount.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceBankDetailsDto implements Serializable {
    private String bankName;
    private String branchName;
    private String accountHolderName;
    private String accountNumber;
    private String ifscCode;
    private String upiId;
    private String swiftCode;
}
