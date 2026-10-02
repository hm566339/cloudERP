package com.erp.account.util;

import java.util.ArrayList;
import java.util.List;

public class PostingResult {
    private String status;
    private String transaction_type;
    private String voucher_no;
    private String posting_date;
    private List<GLEntry> gl_entries = new ArrayList<>();
    private List<String> errors = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTransaction_type() { return transaction_type; }
    public void setTransaction_type(String transaction_type) { this.transaction_type = transaction_type; }

    public String getVoucher_no() { return voucher_no; }
    public void setVoucher_no(String voucher_no) { this.voucher_no = voucher_no; }

    public String getPosting_date() { return posting_date; }
    public void setPosting_date(String posting_date) { this.posting_date = posting_date; }

    public List<GLEntry> getGl_entries() { return gl_entries; }
    public void setGl_entries(List<GLEntry> gl_entries) { this.gl_entries = gl_entries; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public void addEntry(GLEntry e) { this.gl_entries.add(e); }
    public void addError(String e) { this.errors.add(e); }
    public void addWarning(String w) { this.warnings.add(w); }
}
