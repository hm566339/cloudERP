package com.erp.manufacturing.security.feature;

import com.erp.manufacturing.security.authorization.SsoAuthorities;
import com.erp.manufacturing.util.CurrentUserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class FeatureAuthorizationService {

    public boolean hasFeature(UUID userId, String featureCode, String bearerToken) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getAuthorities() == null) {
            log.warn("FBAC check denied: no authenticated security context");
            throw new AccessDeniedException("Authentication context is missing or invalid");
        }

        if (userId == null || !userId.equals(CurrentUserContext.getUserId())) {
            log.warn("FBAC check denied: user id [{}] does not match the authenticated user", userId);
            return false;
        }

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

    public void invalidate(UUID userId) {
    }

    public void clearCache() {
    }
}
