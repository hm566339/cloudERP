package com.erp.account.modules.ledger.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.erp.account.enums.AccountNature;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.accountgroup.entity.AccountGroup;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.budget.entity.BudgetLine;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.gljournal.entity.GlJournalLine;


@Entity
@Table(name = "chart_of_account", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "company_id", "account_code" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartOfAccount extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue

    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private AccountGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_account_id")
    private ChartOfAccount parentAccount;

    @Column(name = "account_code", nullable = false)
    private String accountCode;

    @Column(name = "account_name", nullable = false)
    private String accountName;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountNature accountType;

    @Column(name = "posting_allowed")
    private Boolean postingAllowed;

    @Column(name = "is_active")
    private Boolean isActive;

    /**
     * Legacy compatibility field. ERP accounting impact for opening balances should be created
     * through the Opening Balance GL Journal process rather than persisted as static master data.
     */
    @Column(name = "opening_balance", precision = 19, scale = 4)
    private BigDecimal openingBalance;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @OneToMany(mappedBy = "parentAccount", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ChartOfAccount> childAccounts;

    @OneToMany(mappedBy = "account", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<GlJournalLine> journalLines;

    @OneToMany(mappedBy = "expenseAccount", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ExpenseCategory> expenseCategories;

    @OneToMany(mappedBy = "account", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BudgetLine> budgetLines;
}
