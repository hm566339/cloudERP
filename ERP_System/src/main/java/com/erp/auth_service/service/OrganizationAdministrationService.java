package com.erp.auth_service.service;

import com.erp.auth_service.dto.platform.MemberCompanyRoleDto;
import com.erp.auth_service.dto.platform.PlatformMemberSummaryResponse;
import com.erp.auth_service.dto.response.AccessibleCompanyResponse;
import java.util.List;
import java.util.UUID;

public interface OrganizationAdministrationService {
    void grantCompanyAccess(UUID memberId, UUID companyId);

    void grantCompanyAccess(UUID memberId, UUID companyId, UUID roleId);

    void updateCompanyRole(UUID memberId, UUID companyId, UUID roleId);

    void revokeCompanyAccess(UUID memberId, UUID companyId);

    List<AccessibleCompanyResponse> accessibleCompanies(UUID organizationId);

    List<PlatformMemberSummaryResponse> organizationMembers(UUID organizationId);

    List<MemberCompanyRoleDto> memberCompanyAccesses(UUID memberId);

    List<MemberCompanyRoleDto> userCompanyAccesses(UUID userId);

    UUID resolveMemberIdByUserId(UUID userId);
}