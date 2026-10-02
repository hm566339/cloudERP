package com.erp.account.modules.budget.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;


@Entity
@Table(name = "budget_header")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetHeader extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_year_id")
    private FiscalYear fiscalYear;

    @Column(name = "budget_name")
    private String budgetName;

    @Column(name = "total_budget", precision = 19, scale = 4)
    private BigDecimal totalBudget;



    @OneToMany(mappedBy = "budgetHeader", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BudgetLine> budgetLines;
}


