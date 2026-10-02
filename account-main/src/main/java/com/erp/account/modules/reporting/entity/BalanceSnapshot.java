package com.erp.account.modules.reporting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;


@Entity
@Table(name = "gl_balance_snapshot", indexes = {
        @Index(name = "idx_balance_company_id", columnList = "company_id"),
        @Index(name = "idx_balance_account_id", columnList = "account_id"),
        @Index(name = "idx_balance_period_id", columnList = "accounting_period_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalanceSnapshot extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private ChartOfAccount account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_year_id")
    private FiscalYear fiscalYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accounting_period_id")
    private AccountingPeriod accountingPeriod;

    @Column(name = "snapshot_date")
    private LocalDate snapshotDate;

    @Column(name = "opening_balance", precision = 19, scale = 4)
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @Column(name = "debit_amount", precision = 19, scale = 4)
    private BigDecimal debitAmount = BigDecimal.ZERO;

    @Column(name = "credit_amount", precision = 19, scale = 4)
    private BigDecimal creditAmount = BigDecimal.ZERO;

    @Column(name = "closing_balance", precision = 19, scale = 4)
    private BigDecimal closingBalance = BigDecimal.ZERO;
}
