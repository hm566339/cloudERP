package com.erp.account.util;

import java.math.BigDecimal;
import java.time.LocalDate;

public class GLTransaction {
    private String id;
    private String accountCode;
    private String accountName;
    private String accountType;
    private String parentAccount;
    private LocalDate date;
    private BigDecimal debit = BigDecimal.ZERO;
    private BigDecimal credit = BigDecimal.ZERO;
    private boolean posted = true;
    private Integer fiscalYear;
    private Integer accountingPeriod;
    private String company;
    private String currency;
    private String costCenter;
    private String department;
    private String project;
    private String narration;

    public GLTransaction() {}

    // getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAccountCode() { return accountCode; }
    public void setAccountCode(String accountCode) { this.accountCode = accountCode; }

    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getParentAccount() { return parentAccount; }
    public void setParentAccount(String parentAccount) { this.parentAccount = parentAccount; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public BigDecimal getDebit() { return debit; }
    public void setDebit(BigDecimal debit) { this.debit = debit != null ? debit : BigDecimal.ZERO; }

    public BigDecimal getCredit() { return credit; }
    public void setCredit(BigDecimal credit) { this.credit = credit != null ? credit : BigDecimal.ZERO; }

    public boolean isPosted() { return posted; }
    public void setPosted(boolean posted) { this.posted = posted; }

    public Integer getFiscalYear() { return fiscalYear; }
    public void setFiscalYear(Integer fiscalYear) { this.fiscalYear = fiscalYear; }

    public Integer getAccountingPeriod() { return accountingPeriod; }
    public void setAccountingPeriod(Integer accountingPeriod) { this.accountingPeriod = accountingPeriod; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getCostCenter() { return costCenter; }
    public void setCostCenter(String costCenter) { this.costCenter = costCenter; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }

    public String getNarration() { return narration; }
    public void setNarration(String narration) { this.narration = narration; }
}
