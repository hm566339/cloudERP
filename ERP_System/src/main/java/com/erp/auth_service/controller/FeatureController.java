package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.CreateFeatureRequest;
import com.erp.auth_service.dto.request.GrantFeatureRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.request.RevokeFeatureRequest;
import com.erp.auth_service.dto.request.SyncUserFeaturesRequest;
import com.erp.auth_service.dto.request.UpdateFeatureRequest;
import com.erp.auth_service.dto.response.FeatureResponse;
import com.erp.auth_service.dto.response.MessageResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.response.UserActiveFeaturesResponse;
import com.erp.auth_service.dto.response.UserFeatureResponse;
import com.erp.auth_service.security.CustomUserDetails;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.service.FeatureService;
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
@RequestMapping("/api/sso/features")
@RequiredArgsConstructor
public class FeatureController {

    private final FeatureService featureService;
    private final JwtDecoder jwtDecoder;

    /**
     * GET /api/sso/features
     * List all catalog features.
     */
    @GetMapping
    public ResponseEntity<ResponseWrapper<List<FeatureResponse>>> getAllFeatures() {
        return ResponseEntity.ok(ResponseWrapper.success(featureService.getAllFeatures()));
    }

    /**
     * GET /api/sso/features/{id}
     * Get a catalog feature by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ResponseWrapper<FeatureResponse>> getFeatureById(@PathVariable UUID id) {
        return ResponseEntity.ok(ResponseWrapper.success(featureService.getFeatureById(id)));
    }

    /**
     * POST /api/sso/features
     * Create a new catalog feature.
     */
    @PostMapping
    public ResponseEntity<ResponseWrapper<FeatureResponse>> createFeature(
            @Valid @RequestBody RequestWrapper<CreateFeatureRequest> request) {
        return ResponseEntity.ok(ResponseWrapper.success("Feature created successfully", featureService.createFeature(request.getData())));
    }

    /**
     * PUT /api/sso/features/{id}
     * Update an existing catalog feature.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ResponseWrapper<FeatureResponse>> updateFeature(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<UpdateFeatureRequest> request) {
        return ResponseEntity.ok(ResponseWrapper.success("Feature updated successfully", featureService.updateFeature(id, request.getData())));
    }

    /**
     * DELETE /api/sso/features/{id}
     * Delete a catalog feature by ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseWrapper<MessageResponse>> deleteFeature(@PathVariable UUID id) {
        return ResponseEntity.ok(ResponseWrapper.success(featureService.deleteFeature(id)));
    }

    /**
     * GET /api/sso/features/user/{userId}
     * Get all assigned features for a user (Admin only).
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ResponseWrapper<List<UserFeatureResponse>>> getUserFeatures(
            @PathVariable UUID userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {
        assertCanAccessUserData(userId, authentication, authHeader);
        return ResponseEntity.ok(ResponseWrapper.success(featureService.getUserFeatures(userId)));
    }

    /**
     * GET /api/sso/features/user/{userId}/active
     * Get list of currently active feature codes for a user.
     * Used by downstream microservices for authorization evaluation.
     */
    @GetMapping("/user/{userId}/active")
    public ResponseEntity<ResponseWrapper<UserActiveFeaturesResponse>> getActiveFeatures(
            @PathVariable UUID userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {
        assertCanAccessUserData(userId, authentication, authHeader);
        return ResponseEntity.ok(ResponseWrapper.success(featureService.getActiveFeatures(userId)));
    }

    /**
     * POST /api/sso/features/user/{userId}/grant
     * Grant a feature permission to a user (Admin only).
     */
    @PostMapping("/user/{userId}/grant")
    public ResponseEntity<ResponseWrapper<UserFeatureResponse>> grantFeature(
            @PathVariable UUID userId,
            @Valid @RequestBody RequestWrapper<GrantFeatureRequest> request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {

        UUID adminUserId = resolveCurrentUserId(authentication, authHeader);
        log.info("Admin [{}] granting feature to user [{}]", adminUserId, userId);

        UserFeatureResponse response = featureService.grantFeature(adminUserId, userId, request.getData());
        return ResponseEntity.ok(ResponseWrapper.success("Feature granted successfully", response));
    }

    /**
     * POST /api/sso/features/user/{userId}/revoke
     * Revoke a feature permission from a user (Admin only).
     */
    @PostMapping("/user/{userId}/revoke")
    public ResponseEntity<ResponseWrapper<UserFeatureResponse>> revokeFeature(
            @PathVariable UUID userId,
            @Valid @RequestBody RequestWrapper<RevokeFeatureRequest> request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {

        UUID adminUserId = resolveCurrentUserId(authentication, authHeader);
        log.info("Admin [{}] revoking feature from user [{}]", adminUserId, userId);

        UserFeatureResponse response = featureService.revokeFeature(adminUserId, userId, request.getData());
        return ResponseEntity.ok(ResponseWrapper.success("Feature revoked successfully", response));
    }

    /**
     * PUT /api/sso/features/user/{userId}/sync
     * Synchronize the complete list of features for a user (Admin only).
     */
    @PutMapping("/user/{userId}/sync")
    public ResponseEntity<ResponseWrapper<List<UserFeatureResponse>>> syncUserFeatures(
            @PathVariable UUID userId,
            @Valid @RequestBody RequestWrapper<SyncUserFeaturesRequest> request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {

        UUID adminUserId = resolveCurrentUserId(authentication, authHeader);
        log.info("Admin [{}] synchronizing features for user [{}]", adminUserId, userId);

        List<UserFeatureResponse> response = featureService.syncUserFeatures(adminUserId, userId, request.getData());
        return ResponseEntity.ok(ResponseWrapper.success("User features synchronized successfully", response));
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
