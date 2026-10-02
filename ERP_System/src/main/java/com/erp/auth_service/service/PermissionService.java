package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.AuthorizationCheckRequest;
import com.erp.auth_service.dto.request.GrantPermissionRequest;
import com.erp.auth_service.dto.request.RevokePermissionRequest;
import com.erp.auth_service.dto.request.SyncPermissionsRequest;
import com.erp.auth_service.dto.response.AuthorizationCheckResponse;
import com.erp.auth_service.dto.response.FeaturePermissionResponse;
import com.erp.auth_service.dto.response.UserActivePermissionsResponse;
import com.erp.auth_service.dto.response.UserPermissionResponse;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.dto.response.UserPermissionDetailDto;
import com.erp.auth_service.dto.response.EffectivePermissionsResponse;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PermissionService {

    List<FeaturePermissionResponse> getAllPermissions();

    FeaturePermissionResponse createPermission(com.erp.auth_service.dto.request.CreatePermissionRequest request);

    List<UserPermissionResponse> getUserPermissions(UUID userId);

    UserActivePermissionsResponse getActivePermissions(UUID userId);

    UserPermissionResponse grantPermission(UUID adminUserId, UUID targetUserId, GrantPermissionRequest request);

    UserPermissionResponse revokePermission(UUID adminUserId, UUID targetUserId, RevokePermissionRequest request);

    List<UserPermissionResponse> syncUserPermissions(UUID adminUserId, UUID targetUserId,
            SyncPermissionsRequest request);

    List<FeaturePermissionResponse> getRolePermissions(UUID roleId);

    List<FeaturePermissionResponse> syncRolePermissions(UUID adminUserId, UUID roleId, SyncPermissionsRequest request);

    EffectivePermissionsResponse getEffectivePermissions(UUID userId);

    EffectivePermissionsResponse getEffectivePermissions(UUID userId, UUID companyId);

    void assignOwnerRolePermissions(Role ownerRole, Collection<String> moduleNames, UUID grantedBy);

    AuthorizationCheckResponse checkPermission(AuthorizationCheckRequest request);
}
