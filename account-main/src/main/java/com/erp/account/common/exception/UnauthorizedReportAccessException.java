package com.erp.account.common.exception;

public class UnauthorizedReportAccessException extends ForbiddenException {
    private static final long serialVersionUID = 1L;

    public UnauthorizedReportAccessException(String message) {
        super(message, "UNAUTHORIZED_REPORT_ACCESS");
    }
}
