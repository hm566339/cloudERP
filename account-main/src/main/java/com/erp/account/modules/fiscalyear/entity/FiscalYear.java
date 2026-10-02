package com.erp.account.modules.fiscalyear.entity;

import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.budget.entity.BudgetHeader;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.enums.FiscalYearStatus;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "fiscal_year",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_fiscal_year_company_name", columnNames = {"company_id", "fiscal_year"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FiscalYear extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "fiscal_year", nullable = false, length = 100)
    private String fiscalYear;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Convert(converter = FiscalYearStatusConverter.class)
    @Column(name = "is_closed", nullable = false)
    @Builder.Default
    private FiscalYearStatus status = FiscalYearStatus.OPEN;

    @OneToMany(mappedBy = "fiscalYear", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AccountingPeriod> accountingPeriods;

    @OneToMany(mappedBy = "fiscalYear", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<GlJournalEntry> journalEntries;

    @OneToMany(mappedBy = "fiscalYear", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BudgetHeader> budgetHeaders;

    public Boolean getIsClosed() {
        return status != null && !FiscalYearStatus.OPEN.equals(status);
    }

    public void setIsClosed(Boolean isClosed) {
        this.status = Boolean.TRUE.equals(isClosed) ? FiscalYearStatus.CLOSED : FiscalYearStatus.OPEN;
    }

    @Converter(autoApply = false)
    public static class FiscalYearStatusConverter implements AttributeConverter<FiscalYearStatus, Boolean> {

        @Override
        public Boolean convertToDatabaseColumn(FiscalYearStatus attribute) {
            if (attribute == null) {
                return Boolean.FALSE;
            }
            return !FiscalYearStatus.OPEN.equals(attribute);
        }

        @Override
        public FiscalYearStatus convertToEntityAttribute(Boolean dbData) {
            if (Boolean.TRUE.equals(dbData)) {
                return FiscalYearStatus.CLOSED;
            }
            return FiscalYearStatus.OPEN;
        }
    }
}


