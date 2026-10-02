package com.erp.account.modules.bankaccount.entity;

import com.erp.account.enums.BankAccountType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;


@Entity
@Table(name = "bank_account", uniqueConstraints = @UniqueConstraint(columnNames = {"company_id", "account_number"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "bank_name", nullable = false, length = 200)
    private String bankName;

    @Column(name = "branch_name", length = 200)
    private String branchName;

    @Column(name = "account_number", nullable = false, length = 40)
    private String accountNumber;

    @Column(name = "ifsc_code", nullable = false, length = 20)
    private String ifscCode;

    @Column(name = "account_holder_name", length = 255)
    private String accountHolderName;

    @Column(name = "swift_code", length = 20)
    private String swiftCode;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = Boolean.FALSE;

    @Column(name = "upi_id", length = 100)
    private String upiId;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 20)
    private BankAccountType accountType;

    @Column(name = "opening_balance", precision = 19, scale = 4, nullable = false)
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gl_account_id", nullable = false)
    private ChartOfAccount glAccount;

    @Column(name = "is_active")
    private Boolean isActive = Boolean.TRUE;

    @OneToMany(mappedBy = "bankAccount", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BankTransaction> bankTransactions;

    @OneToMany(mappedBy = "bankAccount", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PaymentVoucher> paymentVouchers;
}


