package com.erp.crm.modules.account.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.account.enums.AccountTier;
import com.erp.crm.modules.account.enums.AccountType;
import com.erp.crm.modules.account.enums.BusinessType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "crm_account", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_account_company_code", columnNames = {"company_id", "account_code"}),
        @UniqueConstraint(name = "uq_crm_account_company_id", columnNames = {"company_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmAccount extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "account_code", nullable = false, length = 50)
    private String accountCode;

    @Column(name = "account_name", nullable = false, length = 255)
    private String accountName;

    @Enumerated(EnumType.STRING)
        @Column(name = "account_type", nullable = false)
    @Builder.Default
    private AccountType accountType = AccountType.PROSPECT;

    @Column(name = "parent_account_id")
    private UUID parentAccountId;

    @Column(name = "industry", length = 100)
    private String industry;

    @Enumerated(EnumType.STRING)
        @Column(name = "business_type")
    @Builder.Default
    private BusinessType businessType = BusinessType.PVT_LTD;

    @Enumerated(EnumType.STRING)
        @Column(name = "tier")
    @Builder.Default
    private AccountTier tier = AccountTier.TIER_2;

    @Column(name = "gstin", length = 15)
    private String gstin;

    @Column(name = "pan", length = 10)
    private String pan;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "annual_revenue", precision = 19, scale = 4)
    private BigDecimal annualRevenue;

    @Column(name = "employee_count")
    private Integer employeeCount;

    @Column(name = "credit_rating", length = 50)
    private String creditRating;

    @Column(name = "owner_user_id")
    private UUID ownerUserId;

    @Column(name = "billing_address_id")
    private UUID billingAddressId;

    @Column(name = "shipping_address_id")
    private UUID shippingAddressId;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "account_main_customer_id")
    private UUID accountMainCustomerId;
}
