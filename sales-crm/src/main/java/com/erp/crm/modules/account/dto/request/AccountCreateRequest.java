package com.erp.crm.modules.account.dto.request;

import com.erp.crm.modules.account.enums.AccountTier;
import com.erp.crm.modules.account.enums.AccountType;
import com.erp.crm.modules.account.enums.BusinessType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountCreateRequest {

    @NotBlank(message = "Account name is required")
    private String accountName;

    @Builder.Default
    private AccountType accountType = AccountType.PROSPECT;

    private UUID parentAccountId;

    private String industry;

    @Builder.Default
    private BusinessType businessType = BusinessType.PVT_LTD;

    @Builder.Default
    private AccountTier tier = AccountTier.TIER_2;

    private String gstin;

    private String pan;

    private String website;

    private String phone;

    private String email;

    private BigDecimal annualRevenue;

    private Integer employeeCount;

    private String creditRating;

    private UUID ownerUserId;

    private AddressRequest billingAddress;

    private AddressRequest shippingAddress;
}

