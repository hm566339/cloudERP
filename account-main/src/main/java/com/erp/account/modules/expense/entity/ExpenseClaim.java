package com.erp.account.modules.expense.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.erp.account.enums.ApprovalStatus;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;

@Entity
@Table(name = "expense_claim")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseClaim extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue

    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "employee_role")
    private String employeeRole;

    @Column(name = "claim_no")
    private String claimNo;

    @Column(name = "claim_date")
    private LocalDate claimDate;

    @Column(name = "claim_amount", precision = 19, scale = 4)
    private BigDecimal claimAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ApprovalStatus status;

    @Column(name = "expense_request_id")
    private UUID expenseRequestId;

    @OneToMany(mappedBy = "expenseClaim", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<ExpenseClaimItem> items = new ArrayList<>();
}
