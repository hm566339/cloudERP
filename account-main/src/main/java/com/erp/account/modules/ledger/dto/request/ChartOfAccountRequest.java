package com.erp.account.modules.ledger.dto.request;

import java.math.BigDecimal;
import java.util.UUID;

import com.erp.account.enums.AccountNature;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartOfAccountRequest {

    @Size(max = 50, message = "Account code must not exceed 50 characters")
    private String accountCode;

    @NotBlank(message = "Account name is required")
    @Size(max = 150, message = "Account name must not exceed 150 characters")
    private String accountName;

    @NotNull(message = "Account group is required")
    private UUID groupId;

    private UUID parentAccountId;

    @NotNull(message = "Account type is required")
    private AccountNature accountType;

    private Boolean postingAllowed;

    private Boolean isActive;

    private BigDecimal openingBalance;
}
