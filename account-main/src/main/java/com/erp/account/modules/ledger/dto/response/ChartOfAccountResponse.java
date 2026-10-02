package com.erp.account.modules.ledger.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.erp.account.enums.AccountNature;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartOfAccountResponse extends BaseResponseDto  {

    private UUID id;

    private UUID companyId;

    private UUID groupId;

    private String groupName;

    private UUID parentAccountId;

    private String parentAccountCode;

    private String accountCode;

    private String accountName;

    private AccountNature accountType;

    private Boolean postingAllowed;

    private Boolean isActive;

    private BigDecimal openingBalance;

    private Boolean deleted;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private UUID createdBy;

    private UUID updatedBy;
}
