package com.erp.manufacturing.security.sso;

import java.util.UUID;

public interface CompanyCurrencyService {

    /**
     * Resolves and returns the verified ISO currency code for the specified company from SSO.
     *
     * @param companyId the company ID (if null, resolved from current tenant context)
     * @return 3-letter uppercase ISO currency code
     */
    String getCompanyCurrency(UUID companyId);

    /**
     * Invalidates any cached currency entries (useful for testing or cache eviction).
     */
    void clearCache();
}
