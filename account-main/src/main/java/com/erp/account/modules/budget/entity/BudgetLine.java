package com.erp.account.modules.budget.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.company.entity.Company;


@Entity
@Table(name = "budget_line")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetLine extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_header_id", nullable = false)
    private BudgetHeader budgetHeader;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private ChartOfAccount account;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "allocated_amount", precision = 19, scale = 4)
    private BigDecimal allocatedAmount;

    @Column(name = "utilized_amount", precision = 19, scale = 4)
    private BigDecimal utilizedAmount;

    public BigDecimal getRemainingAmount() {
        BigDecimal allocated = allocatedAmount != null ? allocatedAmount : BigDecimal.ZERO;
        BigDecimal utilized = utilizedAmount != null ? utilizedAmount : BigDecimal.ZERO;
        return allocated.subtract(utilized).setScale(19, RoundingMode.HALF_UP);
    }

    public BigDecimal getUtilizationPercentage() {
        BigDecimal allocated = allocatedAmount != null ? allocatedAmount : BigDecimal.ZERO;
        BigDecimal utilized = utilizedAmount != null ? utilizedAmount : BigDecimal.ZERO;
        if (allocated.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return utilized.divide(allocated, 8, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(4, RoundingMode.HALF_UP);
    }
}


