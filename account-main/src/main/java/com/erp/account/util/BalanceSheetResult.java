package com.erp.account.util;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BalanceSheetResult {
    private String status;
    private Integer fiscalYear;
    private Integer period;
    private BigDecimal totalAssets = BigDecimal.ZERO;
    private BigDecimal totalLiabilities = BigDecimal.ZERO;
    private BigDecimal totalEquity = BigDecimal.ZERO;
    private boolean isBalanced;
    private List<AccountCategoryBalance> assets = new ArrayList<>();
    private List<AccountCategoryBalance> liabilities = new ArrayList<>();
    private List<AccountCategoryBalance> equity = new ArrayList<>();
    private List<String> errors = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getFiscalYear() { return fiscalYear; }
    public void setFiscalYear(Integer fiscalYear) { this.fiscalYear = fiscalYear; }

    public Integer getPeriod() { return period; }
    public void setPeriod(Integer period) { this.period = period; }

    public BigDecimal getTotalAssets() { return totalAssets; }
    public void setTotalAssets(BigDecimal totalAssets) { this.totalAssets = totalAssets; }

    public BigDecimal getTotalLiabilities() { return totalLiabilities; }
    public void setTotalLiabilities(BigDecimal totalLiabilities) { this.totalLiabilities = totalLiabilities; }

    public BigDecimal getTotalEquity() { return totalEquity; }
    public void setTotalEquity(BigDecimal totalEquity) { this.totalEquity = totalEquity; }

    public boolean isBalanced() { return isBalanced; }
    public void setBalanced(boolean balanced) { isBalanced = balanced; }

    public List<AccountCategoryBalance> getAssets() { return assets; }
    public void setAssets(List<AccountCategoryBalance> assets) { this.assets = assets; }

    public List<AccountCategoryBalance> getLiabilities() { return liabilities; }
    public void setLiabilities(List<AccountCategoryBalance> liabilities) { this.liabilities = liabilities; }

    public List<AccountCategoryBalance> getEquity() { return equity; }
    public void setEquity(List<AccountCategoryBalance> equity) { this.equity = equity; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public void addAsset(AccountCategoryBalance a) { this.assets.add(a); }
    public void addLiability(AccountCategoryBalance a) { this.liabilities.add(a); }
    public void addEquity(AccountCategoryBalance a) { this.equity.add(a); }
    public void addError(String e) { this.errors.add(e); }
    public void addWarning(String w) { this.warnings.add(w); }
}
