package com.erp.account.security.feature;

import com.erp.account.security.CurrentUserContext;
import com.erp.account.security.authorization.SsoAuthorities;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.UUID;

/**
 * Feature-based access control backed by the already-verified SSO response.
 * <p>
 * Features are read exclusively from the authorities that
 * {@link com.erp.account.security.AuthenticationFilter} placed in the
 * {@code SecurityContext} for the current request (fresh per request, never stale).
 * No local role configuration and no separate SSO round-trip is performed, so the
 * verified response is reused safely without any privilege-escalation risk.
 * <p>
 * A user must hold the active {@code FEATURE_<code>} authority (granted only when the
 * SSO verification returned the feature as active, or an active+allowed permission on it).
 * Missing/incomplete authorization data fails closed.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FeatureAuthorizationService {

    /**
     * Checks if the authenticated user has the required feature active.
     * Always fails closed on missing/incomplete authorization data.
     */
    public boolean hasFeature(UUID userId, String featureCode, String bearerToken) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getAuthorities() == null) {
            log.warn("FBAC check denied: no authenticated security context");
            throw new AccessDeniedException("Authentication context is missing or invalid");
        }

        // The user id on the current request must match the authenticated identity
        // being checked (prevents cross-user authorization using a foreign id).
        if (userId == null || !userId.equals(CurrentUserContext.getUserId())) {
            log.warn("FBAC check denied: user id [{}] does not match the authenticated user", userId);
            return false;
        }

        // SYSTEM_ADMIN bypass (only present when SSO returned the active SYSTEM_ADMIN role).
        if (CurrentUserContext.isSystemAdmin()) {
            log.debug("SYSTEM_ADMIN bypass granted for user [{}] on feature [{}]", userId, featureCode);
            return true;
        }

        if (featureCode == null || featureCode.isBlank()) {
            log.warn("FBAC check denied: blank feature code");
            return false;
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        boolean has = SsoAuthorities.hasFeature(authorities, featureCode);
        log.debug("FBAC result for user [{}] on feature [{}] -> {}", userId, featureCode, has);
        return has;
    }

    /**
     * No-op. Feature data is fresh per request from the verified SSO response and there
     * is no cache to invalidate. Kept for API compatibility.
     */
    public void invalidate(UUID userId) {
        // nothing cached
    }

    /**
     * No-op. Kept for API compatibility.
     */
    public void clearCache() {
        // nothing cached
    }
}