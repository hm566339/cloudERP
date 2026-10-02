package com.erp.auth_service.service;

import java.util.UUID;

import com.erp.auth_service.dto.response.PortalAccessGrantResponse;
import com.erp.auth_service.dto.response.UserPortalAccessListResponse;
import com.erp.auth_service.dto.response.UserRoleAssignmentResponse;

public interface UserAccessService {

    UserRoleAssignmentResponse assignRole(UUID userId, UUID roleId);

    void removeRole(UUID userId, UUID roleId);

    PortalAccessGrantResponse grantPortalAccess(UUID userId, UUID moduleId);

    void removePortalAccess(UUID userId, UUID moduleId);

    UserPortalAccessListResponse getUserPortalAccesses(
            UUID companyId,
            int page,
            int pageSize,
            String search,
            Boolean status);

    void togglePortalAccess(UUID userId, UUID moduleId);
}