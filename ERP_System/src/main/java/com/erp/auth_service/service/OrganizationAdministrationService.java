package com.erp.auth_service.service;

import com.erp.auth_service.dto.platform.MemberCompanyRoleDto;
import com.erp.auth_service.dto.platform.PlatformMemberSummaryResponse;
import com.erp.auth_service.dto.request.InviteMemberRequest;
import com.erp.auth_service.dto.response.AccessibleCompanyResponse;
import com.erp.auth_service.dto.response.InviteMemberResponse;
import java.util.List;
import java.util.UUID;

public interface OrganizationAdministrationService {
    InviteMemberResponse inviteMember(UUID organizationId, InviteMemberRequest request);

    InviteMemberResponse resendInvitation(UUID organizationId, UUID memberId);

    void updateMemberStatus(UUID memberId, String status);

    void removeMemberFromOrganization(UUID memberId);

    void grantCompanyAccess(UUID memberId, UUID companyId);

    void grantCompanyAccess(UUID memberId, UUID companyId, UUID roleId);

    void grantCompanyAccess(UUID memberId, UUID companyId, List<UUID> roleIds);

    void updateCompanyRole(UUID memberId, UUID companyId, UUID roleId);

    void addCompanyRole(UUID memberId, UUID companyId, UUID roleId);

    void removeCompanyRole(UUID memberId, UUID companyId, UUID roleId);

    void syncCompanyRoles(UUID memberId, UUID companyId, List<UUID> roleIds);

    void revokeCompanyAccess(UUID memberId, UUID companyId);

    List<AccessibleCompanyResponse> accessibleCompanies(UUID organizationId);

    List<PlatformMemberSummaryResponse> organizationMembers(UUID organizationId);

    List<MemberCompanyRoleDto> memberCompanyAccesses(UUID memberId);

    List<MemberCompanyRoleDto> userCompanyAccesses(UUID userId);

    UUID resolveMemberIdByUserId(UUID userId);
}
