package com.erp.manufacturing.util;

import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.common.exception.ExternalServiceException;

import java.util.UUID;

public final class CurrentUserContext {

    private static final ThreadLocal<UUID> companyIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<UUID> userIdHolder = new ThreadLocal<>();

    private CurrentUserContext() {
        throw new AssertionError("Cannot instantiate CurrentUserContext");
    }

    public static void setCompanyId(UUID companyId) {
        companyIdHolder.set(companyId);
    }

    public static UUID getCompanyId() {
        return companyIdHolder.get();
    }

    public static void setUserId(UUID userId) {
        userIdHolder.set(userId);
    }

    public static UUID getUserId() {
        return userIdHolder.get();
    }

    public static UUID resolveCompanyId(UUID requestCompanyId) {
        UUID companyId = requestCompanyId != null ? requestCompanyId : getCompanyId();
        if (companyId == null) {
            throw new BusinessValidationException("Company ID is required for this operation.");
        }
        return companyId;
    }

    public static void clear() {
        companyIdHolder.remove();
        userIdHolder.remove();
    }
}