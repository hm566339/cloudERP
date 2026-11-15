package com.erp.crm.common.security.feature;

import com.erp.crm.common.exception.UnauthorizedException;
import com.erp.crm.common.security.CurrentUserContext;
import com.erp.crm.common.security.annotation.RequireFeature;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.annotation.Order;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
@Order(1)
@Slf4j
@RequiredArgsConstructor
public class FeatureAuthorizationAspect {

    private final FeatureAuthorizationService featureAuthorizationService;

    @Around("@annotation(requireFeature) || @within(requireFeature)")
    public Object enforceFeatureAccess(ProceedingJoinPoint joinPoint, RequireFeature requireFeature) throws Throwable {

        // 1. Authenticate JWT: Check if user is authenticated in SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            log.warn("FBAC Denied: Missing or invalid authentication token on method [{}]", joinPoint.getSignature().toShortString());
            throw new UnauthorizedException("Authentication token is missing or invalid");
        }

        // 2. Identify the authenticated user
        UUID userId = CurrentUserContext.getUserId();
        if (userId == null) {
            log.warn("FBAC Denied: Authenticated user context contains no user ID on method [{}]", joinPoint.getSignature().toShortString());
            throw new UnauthorizedException("Authentication token is missing valid user identity");
        }

        // 3. Check SYSTEM_ADMIN bypass (present only when SSO returned the active SYSTEM_ADMIN role)
        if (CurrentUserContext.isSystemAdmin()) {
            log.debug("SYSTEM_ADMIN authorized by bypass on feature [{}]", requireFeature.value());
            return joinPoint.proceed();
        }

        // 4. Verify the active feature against the VERIFIED SSO permissions/features already
        //    stored in the SecurityContext. No extra SSO round-trip, no stale cache.
        String featureCode = requireFeature.value();
        boolean hasAccess = featureAuthorizationService.hasFeature(userId, featureCode, null);

        if (!hasAccess) {
            log.warn("FBAC Access Denied: User [{}] does not have active feature [{}] for method [{}]",
                    userId, featureCode, joinPoint.getSignature().toShortString());
            throw new AccessDeniedException("User lacks required feature permission: " + featureCode);
        }

        // 5. Allow access
        log.debug("FBAC Access Allowed: User [{}] verified for feature [{}] on [{}]",
                userId, featureCode, joinPoint.getSignature().toShortString());
        return joinPoint.proceed();
    }
}