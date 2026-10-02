package com.erp.account.util;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class PnLResult {
    private String status;
    private Integer fiscalYear;
    private Integer period;
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private BigDecimal totalCOGS = BigDecimal.ZERO;
    private BigDecimal totalExpenses = BigDecimal.ZERO;
    private BigDecimal grossProfit = BigDecimal.ZERO;
    private BigDecimal netProfit = BigDecimal.ZERO;
    private List<PnLCategoryBalance> revenues = new ArrayList<>();
    private List<PnLCategoryBalance> expenses = new ArrayList<>();
    private List<String> errors = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getFiscalYear() { return fiscalYear; }
    public void setFiscalYear(Integer fiscalYear) { this.fiscalYear = fiscalYear; }

    public Integer getPeriod() { return period; }
    public void setPeriod(Integer period) { this.period = period; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public BigDecimal getTotalCOGS() { return totalCOGS; }
    public void setTotalCOGS(BigDecimal totalCOGS) { this.totalCOGS = totalCOGS; }

    public BigDecimal getTotalExpenses() { return totalExpenses; }
    public void setTotalExpenses(BigDecimal totalExpenses) { this.totalExpenses = totalExpenses; }

    public BigDecimal getGrossProfit() { return grossProfit; }
    public void setGrossProfit(BigDecimal grossProfit) { this.grossProfit = grossProfit; }

    public BigDecimal getNetProfit() { return netProfit; }
    public void setNetProfit(BigDecimal netProfit) { this.netProfit = netProfit; }

    public List<PnLCategoryBalance> getRevenues() { return revenues; }
    public void setRevenues(List<PnLCategoryBalance> revenues) { this.revenues = revenues; }

    public List<PnLCategoryBalance> getExpenses() { return expenses; }
    public void setExpenses(List<PnLCategoryBalance> expenses) { this.expenses = expenses; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public void addRevenue(PnLCategoryBalance p) { this.revenues.add(p); }
    public void addExpense(PnLCategoryBalance p) { this.expenses.add(p); }
    public void addError(String e) { this.errors.add(e); }
    public void addWarning(String w) { this.warnings.add(w); }
}
