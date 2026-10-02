package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlAccountInfoDto implements Serializable {
    private UUID accountId;
    private String accountCode;
    private String accountName;
    private String accountGroup;
    private String accountCategory;
    private String accountType;
    private String normalBalance;
}
