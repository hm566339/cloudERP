package com.erp.auth_service.security;

import com.erp.auth_service.utility.AccessMode;

import java.util.UUID;

public final class RequestContext {
    private static final ThreadLocal<Context> CURRENT = new ThreadLocal<>();

    private RequestContext() {
    }

    public static void set(UUID userId, UUID organizationId, UUID companyId, UUID clientId, AccessMode accessMode) {
        CURRENT.set(new Context(userId, organizationId, companyId, clientId, accessMode));
    }

    public static Context get() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }

    public record Context(UUID userId, UUID organizationId, UUID companyId, UUID clientId, AccessMode accessMode) {
    }
}