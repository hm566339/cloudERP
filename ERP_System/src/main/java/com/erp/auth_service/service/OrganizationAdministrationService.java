package com.erp.auth_service.service;

import com.erp.auth_service.dto.response.AccessibleCompanyResponse;
import java.util.List;
import java.util.UUID;

public interface OrganizationAdministrationService {
    void grantCompanyAccess(UUID memberId, UUID companyId);
    void revokeCompanyAccess(UUID memberId, UUID companyId);
    List<AccessibleCompanyResponse> accessibleCompanies(UUID organizationId);
}