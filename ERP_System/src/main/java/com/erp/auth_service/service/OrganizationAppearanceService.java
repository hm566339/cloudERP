package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.UpdateOrganizationAppearanceRequest;
import com.erp.auth_service.dto.response.OrganizationAppearanceResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

public interface OrganizationAppearanceService {

    /**
     * Retrieves the persistent appearance configuration for the specified
     * organization.
     * If no configuration has been customized yet, returns the default Sage Nature
     * settings.
     */
    OrganizationAppearanceResponse getAppearance(UUID organizationId);

    /**
     * Updates and persists appearance settings for the specified organization.
     * Enforces that the actor has OWNER, ADMIN, or SYSTEM_ADMIN privileges.
     */
    OrganizationAppearanceResponse updateAppearance(UUID organizationId, UUID actorUserId,
            UpdateOrganizationAppearanceRequest request);

    /**
     * Resets appearance settings to default Sage Nature settings for the
     * organization.
     */
    OrganizationAppearanceResponse resetAppearance(UUID organizationId, UUID actorUserId);

    /**
     * Uploads a branding asset (light logo, dark logo, favicon) with validation (<=
     * 2MB, image MIME type)
     * and associates it with the organization's appearance settings.
     */
    Map<String, Object> uploadAsset(UUID organizationId, UUID actorUserId, MultipartFile file, String assetType);

    /**
     * Validates that the current user has read access to the organization.
     */
    void assertReadPermission(UUID organizationId, UUID actorUserId);

    /**
     * Validates that the current user has write permission (OWNER, ADMIN, or
     * SYSTEM_ADMIN) to modify settings.
     */
    void assertWritePermission(UUID organizationId, UUID actorUserId);
}
