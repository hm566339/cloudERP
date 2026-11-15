package com.erp.crm.common.util;

import java.util.UUID;
import com.erp.crm.common.security.CurrentUserContext;

public class TenantUtils {

    private TenantUtils() {
        throw new AssertionError("Cannot instantiate TenantUtils");
    }

    public static UUID getCurrentCompanyId() {
        return CurrentUserContext.getCompanyId();
    }

    public static UUID getCurrentUserId() {
        return CurrentUserContext.getUserId();
    }

    public static boolean isSystemAdmin() {
        return CurrentUserContext.isSystemAdmin();
    }

    public static boolean hasCompanyId() {
        return CurrentUserContext.hasCompanyId();
    }

    public static boolean hasUserId() {
        return CurrentUserContext.hasUserId();
    }

    public static boolean isAuthenticated() {
        return CurrentUserContext.isAuthenticated();
    }

    public static UUID resolveCompanyId(UUID requestCompanyId) {
        return CurrentUserContext.resolveCompanyId(requestCompanyId);
    }

    public static UUID resolveCompanyIdForQuery(UUID requestCompanyId) {
        return CurrentUserContext.resolveCompanyIdForQuery(requestCompanyId);
    }
}
