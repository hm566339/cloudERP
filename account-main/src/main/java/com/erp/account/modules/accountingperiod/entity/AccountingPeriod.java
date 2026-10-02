package com.erp.account.modules.accountingperiod.entity;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus;
import com.erp.account.modules.accountingperiod.enums.PeriodType;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "accounting_period",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_accounting_period_fiscal_year_number", columnNames = {"fiscal_year_id", "period_number"}),
                @UniqueConstraint(name = "uk_accounting_period_fiscal_year_name", columnNames = {"fiscal_year_id", "period_name"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingPeriod extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_year_id", nullable = false)
    private FiscalYear fiscalYear;

    @NotNull
    @Column(name = "period_number", nullable = false)
    private Integer periodNumber;

    @NotBlank
    @Size(max = 100)
    @Column(name = "period_name", nullable = false, length = 100)
    private String periodName;

    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", nullable = false, length = 20)
    @Builder.Default
    private PeriodType periodType = PeriodType.CUSTOM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AccountingPeriodStatus status = AccountingPeriodStatus.OPEN;

    @OneToMany(mappedBy = "accountingPeriod", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<GlJournalEntry> journalEntries;
}


