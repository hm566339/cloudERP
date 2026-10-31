package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.UpdateGeneralSettingsRequest;
import com.erp.auth_service.dto.request.UpdateLocalizationSettingsRequest;
import com.erp.auth_service.dto.request.UpdateOrganizationSettingsRequest;
import com.erp.auth_service.dto.response.GeneralSettingsResponse;
import com.erp.auth_service.dto.response.LocalizationSettingsResponse;
import com.erp.auth_service.dto.response.OrganizationSettingsResponse;

import java.util.UUID;

public interface GeneralSettingsService {

    OrganizationSettingsResponse getOrganizationSettings(UUID organizationId);

    OrganizationSettingsResponse updateOrganizationSettings(
            UUID organizationId,
            UUID actorUserId,
            UpdateOrganizationSettingsRequest request);

    LocalizationSettingsResponse getLocalizationSettings(UUID organizationId);

    LocalizationSettingsResponse updateLocalizationSettings(
            UUID organizationId,
            UUID actorUserId,
            UpdateLocalizationSettingsRequest request);

    GeneralSettingsResponse getGeneralSettings(UUID organizationId);

    GeneralSettingsResponse updateGeneralSettings(
            UUID organizationId,
            UUID actorUserId,
            UpdateGeneralSettingsRequest request);

    void assertReadPermission(UUID organizationId, UUID actorUserId);

    void assertWritePermission(UUID organizationId, UUID actorUserId);
}

