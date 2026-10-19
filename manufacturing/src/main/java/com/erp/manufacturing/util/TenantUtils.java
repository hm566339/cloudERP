package com.erp.manufacturing.util;

import java.util.UUID;

public final class TenantUtils {

    private TenantUtils() {
        throw new AssertionError("Cannot instantiate TenantUtils");
    }

    public static UUID getCurrentCompanyId() {
        return CurrentUserContext.getCompanyId();
    }

    public static UUID getCurrentUserId() {
        return CurrentUserContext.getUserId();
    }

    public static UUID resolveCompanyId(UUID requestCompanyId) {
        return CurrentUserContext.resolveCompanyId(requestCompanyId);
    }
}