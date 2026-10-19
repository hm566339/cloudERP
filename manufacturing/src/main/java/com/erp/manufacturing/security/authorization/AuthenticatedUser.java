package com.erp.manufacturing.security.authorization;

import com.erp.manufacturing.security.dto.sso.FeatureResponse;
import com.erp.manufacturing.security.dto.sso.PermissionResponse;
import com.erp.manufacturing.security.dto.sso.RoleResponse;
import com.erp.manufacturing.security.dto.sso.TokenVerifyResponse;
import com.erp.manufacturing.security.dto.sso.UserResponse;
import lombok.Builder;
import lombok.Getter;

import java.security.Principal;
import java.util.*;

@Getter
@Builder
public class AuthenticatedUser implements Principal {

    private final UUID userId;
    private final String username;
    private final String companyCode;
    private final UUID companyId;
    private final UUID organizationId;
    private final String organizationCode;
    private final String accessMode;
    private final String fullName;

    private final List<String> roles;
    private final Set<String> activeFeatures;
    private final List<PermissionResponse> permissions;

    public static AuthenticatedUser from(TokenVerifyResponse verifyResponse) {
        if (verifyResponse == null || verifyResponse.getUser() == null) {
            return null;
        }
        UserResponse user = verifyResponse.getUser();

        List<String> roles = new ArrayList<>();
        if (user.getRole() != null) {
            for (RoleResponse role : user.getRole()) {
                if (role != null && role.isStatus() && role.getName() != null && !role.getName().isBlank()) {
                    roles.add(role.getName().trim());
                }
            }
        }

        Set<String> features = new LinkedHashSet<>();
        addFeatures(features, user.getFeatures());
        addFeatures(features, verifyResponse.getFeatures());

        List<PermissionResponse> permissions = new ArrayList<>();
        if (user.getPermissions() != null) {
            permissions.addAll(user.getPermissions());
        }
        if (verifyResponse.getPermissions() != null) {
            permissions.addAll(verifyResponse.getPermissions());
        }

        for (PermissionResponse p : permissions) {
            if (p != null && Boolean.TRUE.equals(p.getActive()) && Boolean.TRUE.equals(p.getAllowed())) {
                if (p.getFeatureCode() != null && !p.getFeatureCode().isBlank()) {
                    features.add(p.getFeatureCode().trim().toUpperCase());
                }
            }
        }

        return AuthenticatedUser.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .companyCode(user.getCompanyCode())
                .companyId(user.getCompanyId())
                .organizationId(user.getOrganizationId())
                .organizationCode(user.getOrganizationCode())
                .accessMode(user.getAccessMode())
                .fullName(user.getFullName())
                .roles(Collections.unmodifiableList(roles))
                .activeFeatures(Collections.unmodifiableSet(features))
                .permissions(Collections.unmodifiableList(permissions))
                .build();
    }

    private static void addFeatures(Set<String> target, List<FeatureResponse> source) {
        if (source == null) return;
        for (FeatureResponse f : source) {
            if (f != null && f.getFeatureCode() != null && !f.getFeatureCode().isBlank()) {
                target.add(f.getFeatureCode().trim().toUpperCase());
            }
        }
    }

    @Override
    public String getName() {
        return username;
    }

    public boolean isSystemAdmin() {
        if (roles == null) return false;
        for (String r : roles) {
            if ("SYSTEM_ADMIN".equalsIgnoreCase(r) || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(r)) {
                return true;
            }
        }
        return false;
    }

    public boolean hasPermission(String moduleName, String action) {
        if (permissions == null || moduleName == null || action == null) {
            return false;
        }
        String normModule = moduleName.trim().toUpperCase();
        String normAction = action.trim().toUpperCase();

        for (PermissionResponse p : permissions) {
            if (p == null) continue;
            if (Boolean.TRUE.equals(p.getActive()) && Boolean.TRUE.equals(p.getAllowed())) {
                String pAction = p.getAction() != null ? p.getAction().trim().toUpperCase() : null;
                if (!normAction.equals(pAction)) {
                    continue;
                }
                String pModule = p.getModuleName() != null ? p.getModuleName().trim().toUpperCase() : null;
                String pFeature = p.getFeatureCode() != null ? p.getFeatureCode().trim().toUpperCase() : null;

                if (normModule.equals(pModule) || normModule.equals(pFeature)) {
                    return true;
                }
            }
        }
        return false;
    }

    public int activeAndAllowedPermissionCount() {
        if (permissions == null) return 0;
        int count = 0;
        for (PermissionResponse p : permissions) {
            if (p != null && Boolean.TRUE.equals(p.getActive()) && Boolean.TRUE.equals(p.getAllowed())) {
                count++;
            }
        }
        return count;
    }
}
