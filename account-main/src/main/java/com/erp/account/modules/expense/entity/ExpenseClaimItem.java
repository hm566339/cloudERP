package com.erp.account.modules.expense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;


@Entity
@Table(name = "expense_claim_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseClaimItem extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_claim_id", nullable = false)
    private ExpenseClaim expenseClaim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_category_id", nullable = false)
    private ExpenseCategory expenseCategory;

    @Column(name = "expense_date")
    private LocalDate expenseDate;

    @Column(name = "description")
    private String description;

    @Column(name = "amount", precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "bill_attachment_url")
    private String billAttachmentUrl;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", length = 30)
    private com.erp.account.enums.PaymentType paymentType;
}


