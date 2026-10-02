package com.erp.account.modules.expense.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.company.entity.Company;


@Entity
@Table(
        name = "expense_category",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"company_id", "category_code"}),
                @UniqueConstraint(columnNames = {"company_id", "category_name"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseCategory extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "category_name")
    private String categoryName;

    @Column(name = "category_code", nullable = false, length = 50)
    private String categoryCode;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_account_id")
    private ChartOfAccount expenseAccount;

    @Column(name = "approval_required")
    private Boolean approvalRequired;

    @OneToMany(mappedBy = "expenseCategory", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ExpenseClaimItem> claimItems;
}


