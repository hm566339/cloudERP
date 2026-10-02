package com.erp.account.util;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class TrialBalanceResult {
    private String status;
    private Integer fiscalYear;
    private Integer period;
    private BigDecimal totalDebit = BigDecimal.ZERO;
    private BigDecimal totalCredit = BigDecimal.ZERO;
    private boolean isBalanced;
    private List<AccountBalance> accounts = new ArrayList<>();
    private List<String> errors = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getFiscalYear() { return fiscalYear; }
    public void setFiscalYear(Integer fiscalYear) { this.fiscalYear = fiscalYear; }

    public Integer getPeriod() { return period; }
    public void setPeriod(Integer period) { this.period = period; }

    public BigDecimal getTotalDebit() { return totalDebit; }
    public void setTotalDebit(BigDecimal totalDebit) { this.totalDebit = totalDebit; }

    public BigDecimal getTotalCredit() { return totalCredit; }
    public void setTotalCredit(BigDecimal totalCredit) { this.totalCredit = totalCredit; }

    public boolean isBalanced() { return isBalanced; }
    public void setBalanced(boolean balanced) { isBalanced = balanced; }

    public List<AccountBalance> getAccounts() { return accounts; }
    public void setAccounts(List<AccountBalance> accounts) { this.accounts = accounts; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public void addAccount(AccountBalance a) { this.accounts.add(a); }
    public void addError(String e) { this.errors.add(e); }
    public void addWarning(String w) { this.warnings.add(w); }
}
