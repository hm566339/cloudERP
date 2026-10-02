package com.erp.account.util;

import java.util.ArrayList;
import java.util.List;

public class ValidationResult {
    private String status;
    private String message;
    private List<String> errors = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();

    public ValidationResult() {}

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public void addError(String e) { this.errors.add(e); }
    public void addWarning(String w) { this.warnings.add(w); }
}
