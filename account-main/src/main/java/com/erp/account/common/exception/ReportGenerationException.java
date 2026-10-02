package com.erp.account.common.exception;

public class ReportGenerationException extends InternalServerException {
    private static final long serialVersionUID = 1L;

    public ReportGenerationException(String message) {
        super(message, "REPORT_GENERATION_ERROR");
    }

    public ReportGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
