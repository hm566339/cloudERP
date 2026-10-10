package com.erp.communication.security;

import java.util.UUID;

public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_COMPANY = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_CALLER = new ThreadLocal<>();

    private TenantContext() {}

    public static void setCompanyId(UUID companyId) {
        CURRENT_COMPANY.set(companyId);
    }

    public static UUID getCompanyId() {
        return CURRENT_COMPANY.get();
    }

    public static void setCaller(String caller) {
        CURRENT_CALLER.set(caller);
    }

    public static String getCaller() {
        return CURRENT_CALLER.get();
    }

    public static void clear() {
        CURRENT_COMPANY.remove();
        CURRENT_CALLER.remove();
    }
}
