package com.erp.account.modules.company.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.accountcategory.entity.AccountCategory;
import com.erp.account.modules.accountgroup.entity.AccountGroup;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.ledger.entity.ChartOfAccount;

@Entity
@Table(name = "company")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Company extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "company_code")
    private String companyCode;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "gstin")
    private String gstin;

    @Column(name = "base_currency")
    private String baseCurrency;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "address_line_1", length = 255)
    private String addressLine1;

    @Column(name = "address_line_2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "company_type", length = 100)
    private String companyType;

    @Column(name = "legal_name", length = 255)
    private String legalName;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "pan", length = 20)
    private String pan;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "initialization_completed")
    @Builder.Default
    private Boolean initializationCompleted = false;

    @Column(name = "initialization_in_progress")
    @Builder.Default
    private Boolean initializationInProgress = false;

    @Column(name = "is_composition_scheme")
    @Builder.Default
    private Boolean isCompositionScheme = false;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AccountCategory> accountCategories;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AccountGroup> accountGroups;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ChartOfAccount> chartOfAccounts;

    @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BankAccount> bankAccounts;
}
