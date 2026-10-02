package com.erp.account.modules.expense.entity;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.ReimbursementStatus;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "reimbursement")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reimbursement extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "expense_claim_id", nullable = false)
    private UUID expenseClaimId;

    @Column(name = "reimbursement_no", nullable = false, length = 50)
    private String reimbursementNo;

    @Column(name = "reimbursement_date", nullable = false)
    private LocalDate reimbursementDate;

    @Column(name = "reimbursement_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal reimbursementAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ReimbursementStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMode paymentMethod;

    @Column(name = "payment_reference")
    private String paymentReference;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
