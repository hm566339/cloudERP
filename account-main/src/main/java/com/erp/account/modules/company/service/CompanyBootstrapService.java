package com.erp.account.modules.company.service;

import java.util.UUID;

/**
 * Ensures that a company exists in the local database, auto-provisioning
 * from the SSO service on first encounter.
 * <p>
 * This service is the single point of truth for the "check-local → verify-SSO → save"
 * flow, used by both {@link com.erp.account.security.AuthenticationFilter} (normal users)
 * and {@link com.erp.account.security.SystemAdminCompanyIdAspect} (system admins).
 */
public interface CompanyBootstrapService {

    /**
     * Ensures a company with the given code exists locally.
     * If it does not exist, verifies it via SSO and provisions it.
     *
     * @param companyCode the company code from the JWT
     * @param bearerToken the Authorization header value (with or without "Bearer " prefix)
     * @return the local company's UUID
     */
    UUID ensureCompanyByCode(String companyCode, String bearerToken);

    /**
     * Ensures a company with the given UUID exists locally.
     * If it does not exist, verifies it via SSO and provisions it.
     *
     * @param companyId   the company UUID from the request
     * @param bearerToken the Authorization header value (with or without "Bearer " prefix)
     * @return the local company's UUID
     */
    UUID ensureCompanyById(UUID companyId, String bearerToken);
}
