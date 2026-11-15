package com.erp.crm.modules.account.dto.response;

import com.erp.crm.modules.account.enums.AccountTier;
import com.erp.crm.modules.account.enums.AccountType;
import com.erp.crm.modules.account.enums.BusinessType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountResponse {

    private UUID id;
    private UUID companyId;
    private String accountCode;
    private String accountName;
    private AccountType accountType;
    private UUID parentAccountId;
    private String industry;
    private BusinessType businessType;
    private AccountTier tier;
    private String gstin;
    private String pan;
    private String website;
    private String phone;
    private String email;
    private BigDecimal annualRevenue;
    private Integer employeeCount;
    private String creditRating;
    private UUID ownerUserId;
    private Boolean isActive;
    private UUID accountMainCustomerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

