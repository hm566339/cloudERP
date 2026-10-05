package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.*;
import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.security.CustomUserDetails;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;
    private final JwtDecoder jwtDecoder;

    /**
     * GET /api/sso/permissions
     * List all available catalog permissions.
     */
    @GetMapping("/api/sso/permissions")
    public ResponseEntity<ResponseWrapper<List<FeaturePermissionResponse>>> getAllPermissions() {
        return ResponseEntity.ok(ResponseWrapper.success(permissionService.getAllPermissions()));
    }

    /**
     * POST /api/sso/permissions
     * Create a new catalog permission.
     */
    @PostMapping("/api/sso/permissions")
    public ResponseEntity<ResponseWrapper<FeaturePermissionResponse>> createPermission(
            @Valid @RequestBody RequestWrapper<com.erp.auth_service.dto.request.CreatePermissionRequest> request,
            Authentication authentication) {
        assertSystemAdmin(authentication);
        return ResponseEntity.ok(ResponseWrapper.success("Permission created successfully", permissionService.createPermission(request.getData())));
    }

    /**
     * GET /api/sso/permissions/user/{userId}
     * Get all assigned permissions for a user (Admin only).
     */
    @GetMapping("/api/sso/permissions/user/{userId}")
    public ResponseEntity<ResponseWrapper<List<UserPermissionResponse>>> getUserPermissions(
            @PathVariable UUID userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {
        assertCanAccessUserData(userId, authentication, authHeader);
        return ResponseEntity.ok(ResponseWrapper.success(permissionService.getUserPermissions(userId)));
    }

    /**
     * GET /api/sso/permissions/user/{userId}/active
     * Get list of currently active permission codes for a user.
     * Used by downstream microservices for authorization evaluation and caching.
     */
    @GetMapping("/api/sso/permissions/user/{userId}/active")
    public ResponseEntity<ResponseWrapper<UserActivePermissionsResponse>> getActivePermissions(
            @PathVariable UUID userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {
        assertCanAccessUserData(userId, authentication, authHeader);
        return ResponseEntity.ok(ResponseWrapper.success(permissionService.getActivePermissions(userId)));
    }

    /**
     * POST /api/sso/permissions/user/{userId}/grant
     * Grant an action permission to a user (Admin only).
     */
    @PostMapping("/api/sso/permissions/user/{userId}/grant")
    public ResponseEntity<ResponseWrapper<UserPermissionResponse>> grantPermission(
            @PathVariable UUID userId,
            @Valid @RequestBody RequestWrapper<GrantPermissionRequest> wrapper,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {

        GrantPermissionRequest request = wrapper.getData();
        UUID adminUserId = resolveCurrentUserId(authentication, authHeader);
        log.info("Admin [{}] granting permission {}:{} to user [{}]",
                adminUserId, request.getFeatureCode(), request.getAction(), userId);

        UserPermissionResponse response = permissionService.grantPermission(adminUserId, userId, request);
        return ResponseEntity.ok(ResponseWrapper.success("Permission granted successfully", response));
    }

    /**
     * POST /api/sso/permissions/user/{userId}/revoke
     * Revoke an action permission from a user (Admin only).
     */
    @PostMapping("/api/sso/permissions/user/{userId}/revoke")
    public ResponseEntity<ResponseWrapper<UserPermissionResponse>> revokePermission(
            @PathVariable UUID userId,
            @Valid @RequestBody RequestWrapper<RevokePermissionRequest> wrapper,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {

        RevokePermissionRequest request = wrapper.getData();
        UUID adminUserId = resolveCurrentUserId(authentication, authHeader);
        log.info("Admin [{}] revoking permission {}:{} from user [{}]",
                adminUserId, request.getFeatureCode(), request.getAction(), userId);

        UserPermissionResponse response = permissionService.revokePermission(adminUserId, userId, request);
        return ResponseEntity.ok(ResponseWrapper.success("Permission revoked successfully", response));
    }

    /**
     * PUT /api/sso/permissions/user/{userId}/sync
     * Synchronize permissions for a user (Admin only).
     */
    @PutMapping("/api/sso/permissions/user/{userId}/sync")
    public ResponseEntity<ResponseWrapper<List<UserPermissionResponse>>> syncUserPermissions(
            @PathVariable UUID userId,
            @Valid @RequestBody RequestWrapper<SyncPermissionsRequest> wrapper,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {

        SyncPermissionsRequest request = wrapper.getData();
        UUID adminUserId = resolveCurrentUserId(authentication, authHeader);
        log.info("Admin [{}] synchronizing permissions for user [{}]", adminUserId, userId);

        List<UserPermissionResponse> response = permissionService.syncUserPermissions(adminUserId, userId, request);
        return ResponseEntity.ok(ResponseWrapper.success("User permissions synchronized successfully", response));
    }

    /**
     * GET /api/sso/role/{roleId}/permissions
     * Get all assigned permissions for a role.
     */
    @GetMapping("/api/sso/role/{roleId}/permissions")
    public ResponseEntity<ResponseWrapper<List<FeaturePermissionResponse>>> getRolePermissions(
            @PathVariable UUID roleId) {
        return ResponseEntity.ok(ResponseWrapper.success(permissionService.getRolePermissions(roleId)));
    }

    /**
     * PUT /api/sso/role/{roleId}/permissions/sync
     * Synchronize permissions for a role (Admin only).
     */
    @PutMapping("/api/sso/role/{roleId}/permissions/sync")
    public ResponseEntity<ResponseWrapper<List<FeaturePermissionResponse>>> syncRolePermissions(
            @PathVariable UUID roleId,
            @Valid @RequestBody RequestWrapper<SyncPermissionsRequest> wrapper,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {

        SyncPermissionsRequest request = wrapper.getData();
        UUID adminUserId = resolveCurrentUserId(authentication, authHeader);
        log.info("Admin [{}] synchronizing permissions for role [{}]", adminUserId, roleId);

        List<FeaturePermissionResponse> response = permissionService.syncRolePermissions(adminUserId, roleId, request);
        return ResponseEntity.ok(ResponseWrapper.success("Role permissions synchronized successfully", response));
    }

    /**
     * GET /api/sso/permissions/user/{userId}/effective
     * Get effective permissions for a user considering role inheritances and user overrides.
     */
    @GetMapping("/api/sso/permissions/user/{userId}/effective")
    public ResponseEntity<ResponseWrapper<EffectivePermissionsResponse>> getEffectivePermissions(
            @PathVariable UUID userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {
        assertCanAccessUserData(userId, authentication, authHeader);
        return ResponseEntity.ok(ResponseWrapper.success(permissionService.getEffectivePermissions(userId)));
    }

    /**
     * POST /internal/authorization/check
     * Internal endpoint for downstream services to verify authorization.
     */
    @PostMapping("/internal/authorization/check")
    public ResponseEntity<ResponseWrapper<AuthorizationCheckResponse>> checkPermission(
            @Valid @RequestBody RequestWrapper<AuthorizationCheckRequest> wrapper) {

        AuthorizationCheckRequest request = wrapper.getData();
        log.debug("Internal authorization check for user [{}] on feature [{}:{}]",
                request.getUserId(), request.getFeatureCode(), request.getAction());

        AuthorizationCheckResponse response = permissionService.checkPermission(request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    private void assertCanAccessUserData(UUID targetUserId, Authentication authentication, String authHeader) {
        if (authentication != null && authentication.getAuthorities() != null) {
            boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a ->
                    "SYSTEM_ADMIN".equals(a.getAuthority())
                    || "ROLE_SUPER_ADMIN".equals(a.getAuthority())
                    || "ROLE_SUPPORT_ADMIN".equals(a.getAuthority())
                    || "PERM_PLATFORM_USER_READ".equals(a.getAuthority())
                    || "PLATFORM_USER_READ".equals(a.getAuthority()));
            if (isAdmin) {
                return;
            }
        }
        UUID currentUserId = resolveCurrentUserId(authentication, authHeader);
        if (authHeader != null || (authentication != null && authentication.isAuthenticated())) {
            if (currentUserId == null || !currentUserId.equals(targetUserId)) {
                throw new com.erp.auth_service.exception.ForbiddenException("Access denied: Cannot access data for another user");
            }
        }
    }

    private void assertSystemAdmin(Authentication authentication) {
        if (com.erp.auth_service.security.PlatformSecurityUtil.isElevatedAdmin()) {
            return;
        }
        if (authentication != null && authentication.getAuthorities() != null) {
            boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a ->
                    "SYSTEM_ADMIN".equalsIgnoreCase(a.getAuthority())
                    || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(a.getAuthority())
                    || "ROLE_SUPER_ADMIN".equalsIgnoreCase(a.getAuthority())
                    || "ROLE_PLATFORM_ADMIN".equalsIgnoreCase(a.getAuthority()));
            if (isAdmin) {
                return;
            }
        }
        throw new com.erp.auth_service.exception.ForbiddenException("Access denied: Only SYSTEM_ADMIN is authorized to manage catalog permissions");
    }

    private UUID resolveCurrentUserId(Authentication authentication, String authHeader) {
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails cud && cud.getUser() != null) {
            return cud.getUser().getId();
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                return jwtDecoder.extractUserId(authHeader.substring(7).trim());
            } catch (Exception ignored) {
            }
        }
        return null;
    }
}
