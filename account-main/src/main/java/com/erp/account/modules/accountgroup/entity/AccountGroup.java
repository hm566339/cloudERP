package com.erp.account.modules.accountgroup.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.accountcategory.entity.AccountCategory;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.company.entity.Company;


@Entity
@Table(name = "account_group", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "company_id", "code" }, name = "uk_account_group_company_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountGroup extends BaseEntity implements Serializable {

        private static final long serialVersionUID = 1L;

        @Id
        @GeneratedValue
        private UUID id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "company_id", nullable = false)
        private Company company;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "category_id", nullable = false)
        private AccountCategory category;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "parent_group_id")
        @JsonIgnoreProperties({ "childGroups" })
        private AccountGroup parentGroup;

        @Column(name = "code", nullable = false, length = 50)
        private String code;

        @Column(name = "name", nullable = false)
        private String name;

        @OneToMany(mappedBy = "parentGroup", fetch = FetchType.LAZY)
        @JsonIgnore
        private List<AccountGroup> childGroups;

        @OneToMany(mappedBy = "group", fetch = FetchType.LAZY)
        @JsonIgnore
        private List<ChartOfAccount> chartOfAccounts;
}
