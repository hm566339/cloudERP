package com.erp.manufacturing.security;

import java.util.UUID;

public final class RequestCompanyContext {

    private static final ThreadLocal<UUID> companyIdHolder = new ThreadLocal<>();

    private RequestCompanyContext() {
        throw new AssertionError("Cannot instantiate RequestCompanyContext");
    }

    public static void setCompanyId(UUID companyId) {
        companyIdHolder.set(companyId);
    }

    public static UUID getCompanyId() {
        return companyIdHolder.get();
    }

    public static void clear() {
        companyIdHolder.remove();
    }
}
