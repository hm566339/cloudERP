package com.erp.workflow.security;

import com.erp.workflow.security.authorization.AuthenticatedUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<AuthenticatedUser> getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser) {
            return Optional.of((AuthenticatedUser) auth.getPrincipal());
        }
        return Optional.empty();
    }

    public static Optional<UserPrincipal> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            if (auth.getPrincipal() instanceof UserPrincipal) {
                return Optional.of((UserPrincipal) auth.getPrincipal());
            }
            if (auth.getPrincipal() instanceof AuthenticatedUser user) {
                return Optional.of(UserPrincipal.builder()
                        .userId(user.getUserId())
                        .companyId(user.getOrganizationId())
                        .username(user.getUsername())
                        .roles(user.getRoles())
                        .build());
            }
        }
        return Optional.empty();
    }

    public static Optional<UUID> getCurrentUserId() {
        if (CurrentUserContext.getUserId() != null) {
            return Optional.of(CurrentUserContext.getUserId());
        }
        Optional<AuthenticatedUser> authUser = getAuthenticatedUser();
        if (authUser.isPresent()) {
            return Optional.ofNullable(authUser.get().getUserId());
        }
        return getCurrentUser().map(UserPrincipal::getUserId);
    }

    public static Optional<UUID> getCurrentCompanyId() {
        if (CurrentUserContext.getCompanyId() != null) {
            return Optional.of(CurrentUserContext.getCompanyId());
        }
        Optional<AuthenticatedUser> authUser = getAuthenticatedUser();
        if (authUser.isPresent()) {
            return Optional.ofNullable(authUser.get().getOrganizationId());
        }
        return getCurrentUser().map(UserPrincipal::getCompanyId);
    }

    public static String getCurrentUsername() {
        if (CurrentUserContext.getUsername() != null && !CurrentUserContext.getUsername().isBlank()) {
            return CurrentUserContext.getUsername();
        }
        Optional<AuthenticatedUser> authUser = getAuthenticatedUser();
        if (authUser.isPresent() && authUser.get().getUsername() != null) {
            return authUser.get().getUsername();
        }
        return getCurrentUser().map(UserPrincipal::getUsername).orElse("system");
    }

    public static List<String> getCurrentRoles() {
        Optional<AuthenticatedUser> authUser = getAuthenticatedUser();
        if (authUser.isPresent() && authUser.get().getRoles() != null) {
            return authUser.get().getRoles();
        }
        return getCurrentUser().map(UserPrincipal::getRoles).orElse(Collections.emptyList());
    }

    public static boolean hasRole(String role) {
        if (role == null) {
            return false;
        }
        Optional<AuthenticatedUser> authUser = getAuthenticatedUser();
        if (authUser.isPresent()) {
            return authUser.get().hasActiveRole(role);
        }
        List<String> roles = getCurrentRoles();
        return roles.contains(role) || roles.contains("ROLE_" + role);
    }
}
