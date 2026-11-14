package com.erp.workflow.security.sso;

import com.erp.workflow.dto.sso.CompanyRoleMappingDto;
import com.erp.workflow.security.dto.sso.TokenVerifyResponse;

import java.util.List;
import java.util.UUID;

public interface SsoService {

    /**
     * Verifies the provided access token with the SSO service at POST /api/sso/token/verify.
     *
     * @param accessToken the bearer access token
     * @return the verified token payload
     */
    TokenVerifyResponse verifyToken(String accessToken);

    /**
     * Retrieves active organization IDs from SSO / ERP_System.
     *
     * @return list of active organization UUIDs
     */
    List<UUID> getActiveOrganizationIds();

    /**
     * Retrieves all active companies under an organization along with their role name mappings.
     *
     * @param organizationId target organization UUID
     * @return list of company role mappings
     */
    List<CompanyRoleMappingDto> getCompanyRoleMappings(UUID organizationId);
}

