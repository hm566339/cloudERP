package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.GrantFeatureRequest;
import com.erp.auth_service.dto.request.RevokeFeatureRequest;
import com.erp.auth_service.dto.request.SyncUserFeaturesRequest;
import com.erp.auth_service.dto.response.FeatureResponse;
import com.erp.auth_service.dto.response.UserActiveFeaturesResponse;
import com.erp.auth_service.dto.response.UserFeatureResponse;

import java.util.List;
import java.util.UUID;

public interface FeatureService {

    List<FeatureResponse> getAllFeatures();

    FeatureResponse getFeatureById(UUID id);

    FeatureResponse createFeature(com.erp.auth_service.dto.request.CreateFeatureRequest request);

    FeatureResponse updateFeature(UUID id, com.erp.auth_service.dto.request.UpdateFeatureRequest request);

    com.erp.auth_service.dto.response.MessageResponse deleteFeature(UUID id);

    List<UserFeatureResponse> getUserFeatures(UUID userId);

    UserActiveFeaturesResponse getActiveFeatures(UUID userId);

    UserFeatureResponse grantFeature(UUID adminUserId, UUID targetUserId, GrantFeatureRequest request);

    UserFeatureResponse revokeFeature(UUID adminUserId, UUID targetUserId, RevokeFeatureRequest request);

    List<UserFeatureResponse> syncUserFeatures(UUID adminUserId, UUID targetUserId, SyncUserFeaturesRequest request);
}
