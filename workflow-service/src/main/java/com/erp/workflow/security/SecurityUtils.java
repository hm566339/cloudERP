package com.erp.workflow.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<UserPrincipal> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            return Optional.of((UserPrincipal) auth.getPrincipal());
        }
        return Optional.empty();
    }

    public static Optional<UUID> getCurrentUserId() {
        return getCurrentUser().map(UserPrincipal::getUserId);
    }

    public static Optional<UUID> getCurrentCompanyId() {
        return getCurrentUser().map(UserPrincipal::getCompanyId);
    }

    public static String getCurrentUsername() {
        return getCurrentUser().map(UserPrincipal::getUsername).orElse("system");
    }

    public static List<String> getCurrentRoles() {
        return getCurrentUser().map(UserPrincipal::getRoles).orElse(Collections.emptyList());
    }

    public static boolean hasRole(String role) {
        List<String> roles = getCurrentRoles();
        return roles.contains(role) || roles.contains("ROLE_" + role);
    }
}
