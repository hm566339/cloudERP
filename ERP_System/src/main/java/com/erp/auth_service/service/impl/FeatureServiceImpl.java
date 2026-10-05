package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.CreateFeatureRequest;
import com.erp.auth_service.dto.request.GrantFeatureRequest;
import com.erp.auth_service.dto.request.RevokeFeatureRequest;
import com.erp.auth_service.dto.request.SyncUserFeaturesRequest;
import com.erp.auth_service.dto.request.UpdateFeatureRequest;
import com.erp.auth_service.dto.response.FeatureResponse;
import com.erp.auth_service.dto.response.MessageResponse;
import com.erp.auth_service.dto.response.UserActiveFeaturesResponse;
import com.erp.auth_service.dto.response.UserFeatureResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.Feature;
import com.erp.auth_service.model.FeaturePermission;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserFeature;
import com.erp.auth_service.repository.FeatureRepository;
import com.erp.auth_service.repository.UserFeatureRepository;
import com.erp.auth_service.repository.UserRepository;
import com.erp.auth_service.service.FeatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class FeatureServiceImpl implements FeatureService {

    private final FeatureRepository featureRepository;
    private final UserFeatureRepository userFeatureRepository;
    private final UserRepository userRepository;
    private final com.erp.auth_service.repository.RolePermissionRepository rolePermissionRepository;
    private final com.erp.auth_service.repository.UserPermissionRepository userPermissionRepository;
    private final com.erp.auth_service.repository.FeaturePermissionRepository featurePermissionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FeatureResponse> getAllFeatures() {
        return featureRepository.findAll()
                .stream()
                .map(this::mapToFeatureResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FeatureResponse getFeatureById(UUID id) {
        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found with id: " + id));
        return mapToFeatureResponse(feature);
    }

    @Override
    @Transactional
    public FeatureResponse createFeature(CreateFeatureRequest request) {
        if (featureRepository.findByCodeIgnoreCase(request.getCode().trim()).isPresent()) {
            throw new BadRequestException("Feature already exists with code: " + request.getCode());
        }

        Feature feature = Feature.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .moduleName(request.getModuleName().trim())
                .active(request.isActive())
                .build();

        Feature saved = featureRepository.save(feature);

        // Auto-provision standard READ, WRITE, and DELETE permissions in global catalog
        if (featurePermissionRepository != null) {
            for (String action : List.of("READ", "WRITE", "DELETE")) {
                String permCode = saved.getCode() + ":" + action;
                if (featurePermissionRepository.findByPermissionCodeIgnoreCase(permCode).isEmpty()) {
                    com.erp.auth_service.model.FeaturePermission fp = com.erp.auth_service.model.FeaturePermission.builder()
                            .feature(saved)
                            .action(action)
                            .permissionCode(permCode)
                            .description(action + " access for feature " + saved.getName())
                            .active(true)
                            .build();
                    featurePermissionRepository.save(fp);
                    log.info("Auto-registered standard Feature Permission: [{}]", permCode);
                }
            }
        }

        return mapToFeatureResponse(saved);
    }

    @Override
    @Transactional
    public FeatureResponse updateFeature(UUID id, UpdateFeatureRequest request) {
        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found with id: " + id));

        if (request.getCode() != null && !request.getCode().isBlank()) {
            String newCode = request.getCode().trim().toUpperCase();
            if (!newCode.equalsIgnoreCase(feature.getCode())) {
                featureRepository.findByCodeIgnoreCase(newCode).ifPresent(existing -> {
                    if (!existing.getId().equals(feature.getId())) {
                        throw new BadRequestException("Feature already exists with code: " + newCode);
                    }
                });
                feature.setCode(newCode);
                if (feature.getPermissions() != null) {
                    for (FeaturePermission permission : feature.getPermissions()) {
                        permission.setPermissionCode(newCode + ":" + permission.getAction().toUpperCase());
                    }
                }
            }
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            feature.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            feature.setDescription(request.getDescription().trim());
        }

        if (request.getModuleName() != null && !request.getModuleName().isBlank()) {
            feature.setModuleName(request.getModuleName().trim());
        }

        if (request.getActive() != null) {
            feature.setActive(request.getActive());
        }

        Feature saved = featureRepository.save(feature);
        return mapToFeatureResponse(saved);
    }

    @Override
    @Transactional
    public MessageResponse deleteFeature(UUID id) {
        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found with id: " + id));

        long rolePermCount = rolePermissionRepository != null ? rolePermissionRepository.countByPermission_Feature_Id(id) : 0;
        long userPermCount = userPermissionRepository != null ? userPermissionRepository.countByPermission_Feature_Id(id) : 0;
        long userFeatureCount = userFeatureRepository != null ? userFeatureRepository.countByFeature_Id(id) : 0;

        if (rolePermCount > 0 || userPermCount > 0 || userFeatureCount > 0) {
            // Dependency validation: Do not physically delete when referenced by roles or users. Soft-deactivate instead.
            feature.setActive(false);
            featureRepository.save(feature);
            log.info("Feature [{}] (id={}) is referenced by {} role permissions, {} user permissions, and {} user features. Deactivated (soft-deleted).",
                    feature.getCode(), feature.getId(), rolePermCount, userPermCount, userFeatureCount);
            return new MessageResponse("Feature is referenced by role or user assignments and was deactivated (soft-deleted) to preserve data integrity.");
        }

        log.info("Deleting unreferenced feature with id: {} and code: {}", feature.getId(), feature.getCode());
        featureRepository.delete(feature);
        return new MessageResponse("Feature deleted successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserFeatureResponse> getUserFeatures(UUID userId) {
        getUserOrThrow(userId);
        return userFeatureRepository.findAllByUser_Id(userId)
                .stream()
                .map(this::mapToUserFeatureResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserActiveFeaturesResponse getActiveFeatures(UUID userId) {
        User user = getUserOrThrow(userId);
        List<String> activeFeatureCodes = userFeatureRepository.findActiveFeatureCodesByUserId(userId);

        return UserActiveFeaturesResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .activeFeatures(activeFeatureCodes)
                .build();
    }

    @Override
    @Transactional
    public UserFeatureResponse grantFeature(UUID adminUserId, UUID targetUserId, GrantFeatureRequest request) {
        User targetUser = getUserOrThrow(targetUserId);
        Feature feature = resolveFeature(request.getFeatureId(), request.getFeatureCode());

        if (!feature.isActive()) {
            throw new BadRequestException("Cannot grant inactive feature: " + feature.getCode());
        }

        Optional<UserFeature> existing = userFeatureRepository.findByUser_IdAndFeature_Id(targetUserId, feature.getId());

        UserFeature userFeature;
        if (existing.isPresent()) {
            userFeature = existing.get();
            log.info("Updating existing feature assignment for user: {} feature: {}", targetUser.getUsername(), feature.getCode());
            userFeature.setActive(true);
            userFeature.setRevoked(false);
            userFeature.setRevokedAt(null);
            userFeature.setRevokedBy(null);
            userFeature.setRevokeReason(null);
            userFeature.setGrantedBy(adminUserId);
            userFeature.setGrantedAt(LocalDateTime.now());
        } else {
            log.info("Creating new feature assignment for user: {} feature: {}", targetUser.getUsername(), feature.getCode());
            userFeature = UserFeature.builder()
                    .user(targetUser)
                    .feature(feature)
                    .grantedBy(adminUserId)
                    .grantedAt(LocalDateTime.now())
                    .revoked(false)
                    .active(true)
                    .build();
        }

        UserFeature saved = userFeatureRepository.save(userFeature);
        return mapToUserFeatureResponse(saved);
    }

    @Override
    @Transactional
    public UserFeatureResponse revokeFeature(UUID adminUserId, UUID targetUserId, RevokeFeatureRequest request) {
        getUserOrThrow(targetUserId);
        Feature feature = resolveFeature(request.getFeatureId(), request.getFeatureCode());

        UserFeature userFeature = userFeatureRepository.findByUser_IdAndFeature_Id(targetUserId, feature.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Feature '" + feature.getCode() + "' is not assigned to user"));

        log.info("Revoking feature '{}' for user ID '{}'", feature.getCode(), targetUserId);
        userFeature.setRevoked(true);
        userFeature.setRevokedAt(LocalDateTime.now());
        userFeature.setRevokedBy(adminUserId);
        userFeature.setRevokeReason(request.getReason() != null ? request.getReason() : "Revoked by admin");
        userFeature.setActive(false);

        UserFeature saved = userFeatureRepository.save(userFeature);
        return mapToUserFeatureResponse(saved);
    }

    @Override
    @Transactional
    public List<UserFeatureResponse> syncUserFeatures(UUID adminUserId, UUID targetUserId, SyncUserFeaturesRequest request) {
        User targetUser = getUserOrThrow(targetUserId);

        if (request.getFeatureCodes() == null) {
            throw new BadRequestException("featureCodes list cannot be null");
        }

        Set<String> desiredCodes = request.getFeatureCodes().stream()
                .map(String::trim)
                .map(String::toUpperCase)
                .collect(Collectors.toSet());

        // Validate all desired feature codes exist and are active
        Map<String, Feature> catalogMap = new HashMap<>();
        for (String code : desiredCodes) {
            Feature feature = featureRepository.findByCodeIgnoreCase(code)
                    .orElseThrow(() -> new ResourceNotFoundException("Feature not found in catalog: " + code));
            if (!feature.isActive()) {
                throw new BadRequestException("Cannot assign inactive feature: " + code);
            }
            catalogMap.put(code, feature);
        }

        List<UserFeature> currentAssignments = userFeatureRepository.findAllByUser_Id(targetUserId);
        Map<String, UserFeature> currentByCode = currentAssignments.stream()
                .collect(Collectors.toMap(uf -> uf.getFeature().getCode().toUpperCase(), uf -> uf));

        List<UserFeature> toSave = new ArrayList<>();

        // Revoke features not in desired set
        for (UserFeature uf : currentAssignments) {
            String code = uf.getFeature().getCode().toUpperCase();
            if (!desiredCodes.contains(code)) {
                if (uf.isActive() || !uf.isRevoked()) {
                    uf.setActive(false);
                    uf.setRevoked(true);
                    uf.setRevokedAt(LocalDateTime.now());
                    uf.setRevokedBy(adminUserId);
                    uf.setRevokeReason("Synchronized feature list");
                    toSave.add(uf);
                }
            }
        }

        // Add or re-enable desired features
        for (String code : desiredCodes) {
            Feature feature = catalogMap.get(code);
            UserFeature uf = currentByCode.get(code);
            if (uf != null) {
                if (!uf.isActive() || uf.isRevoked()) {
                    uf.setActive(true);
                    uf.setRevoked(false);
                    uf.setRevokedAt(null);
                    uf.setRevokedBy(null);
                    uf.setRevokeReason(null);
                    uf.setGrantedBy(adminUserId);
                    uf.setGrantedAt(LocalDateTime.now());
                    toSave.add(uf);
                }
            } else {
                UserFeature newUf = UserFeature.builder()
                        .user(targetUser)
                        .feature(feature)
                        .grantedBy(adminUserId)
                        .grantedAt(LocalDateTime.now())
                        .revoked(false)
                        .active(true)
                        .build();
                toSave.add(newUf);
            }
        }

        if (!toSave.isEmpty()) {
            userFeatureRepository.saveAll(toSave);
        }

        return userFeatureRepository.findAllByUser_Id(targetUserId)
                .stream()
                .map(this::mapToUserFeatureResponse)
                .toList();
    }

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private Feature resolveFeature(UUID featureId, String featureCode) {
        if (featureId != null) {
            return featureRepository.findById(featureId)
                    .orElseThrow(() -> new ResourceNotFoundException("Feature not found with id: " + featureId));
        }
        if (featureCode != null && !featureCode.isBlank()) {
            return featureRepository.findByCodeIgnoreCase(featureCode.trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Feature not found with code: " + featureCode));
        }
        throw new BadRequestException("Either featureId or featureCode must be provided");
    }

    private FeatureResponse mapToFeatureResponse(Feature feature) {
        return FeatureResponse.builder()
                .id(feature.getId())
                .code(feature.getCode())
                .name(feature.getName())
                .description(feature.getDescription())
                .moduleName(feature.getModuleName())
                .active(feature.isActive())
                .createdAt(feature.getCreatedAt())
                .updatedAt(feature.getUpdatedAt())
                .build();
    }

    private UserFeatureResponse mapToUserFeatureResponse(UserFeature uf) {
        return UserFeatureResponse.builder()
                .id(uf.getId())
                .userId(uf.getUser().getId())
                .username(uf.getUser().getUsername())
                .featureId(uf.getFeature().getId())
                .featureCode(uf.getFeature().getCode())
                .featureName(uf.getFeature().getName())
                .moduleName(uf.getFeature().getModuleName())
                .grantedBy(uf.getGrantedBy())
                .grantedAt(uf.getGrantedAt())
                .revoked(uf.isRevoked())
                .revokedAt(uf.getRevokedAt())
                .revokedBy(uf.getRevokedBy())
                .revokeReason(uf.getRevokeReason())
                .active(uf.isActive() && !uf.isRevoked() && uf.getFeature().isActive())
                .build();
    }
}
