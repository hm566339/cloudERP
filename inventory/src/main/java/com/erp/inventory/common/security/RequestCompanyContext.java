package com.erp.inventory.common.security;

import java.util.Optional;

public final class RequestCompanyContext {

    private RequestCompanyContext() {
        throw new AssertionError("Cannot instantiate RequestCompanyContext");
    }

    private static final ThreadLocal<Object> CONTEXT = new ThreadLocal<>();

    public static void setCompanyId(Object companyId) {
        CONTEXT.set(companyId);
    }

    public static Optional<Object> getCompanyId() {
        return Optional.ofNullable(CONTEXT.get());
    }

    public static <T> Optional<T> getCompanyId(Class<T> type) {
        Object stored = CONTEXT.get();
        if (type.isInstance(stored)) {
            return Optional.of(type.cast(stored));
        }
        return Optional.empty();
    }

    public static boolean hasCompanyId() {
        return CONTEXT.get() != null;
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
