package com.erp.account.modules.paymentvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankProfileDto {
    private UUID bankAccountId;
    private String bankName;
    private String accountName;
    private String accountNumber;
    private String ifscCode;
    private String branch;
    private String accountType;
    private BigDecimal currentBalance;
}
