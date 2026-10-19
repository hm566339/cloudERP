package com.erp.manufacturing.security.feature;

import com.erp.manufacturing.common.exception.UnauthorizedException;
import com.erp.manufacturing.security.annotation.RequireFeature;
import com.erp.manufacturing.util.CurrentUserContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.annotation.Annotation;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeatureAuthorizationAspectTest {

    @Mock
    private FeatureAuthorizationService featureAuthorizationService;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private Signature signature;

    @InjectMocks
    private FeatureAuthorizationAspect aspect;

    private UUID userId;

    private RequireFeature createRequireFeature(String value) {
        return new RequireFeature() {
            @Override
            public Class<? extends Annotation> annotationType() {
                return RequireFeature.class;
            }

            @Override
            public String value() {
                return value;
            }
        };
    }

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
        lenient().when(joinPoint.getSignature()).thenReturn(signature);
        lenient().when(signature.toShortString()).thenReturn("BomController.create()");
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Aspect throws UnauthorizedException (401) when user is unauthenticated")
    void testEnforceFeatureAccess_Unauthenticated_ThrowsUnauthorizedException() {
        RequireFeature annotation = createRequireFeature("MANUFACTURING");

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                aspect.enforceFeatureAccess(joinPoint, annotation));

        assertTrue(ex.getMessage().contains("missing or invalid"));
        verifyNoInteractions(featureAuthorizationService);
    }

    @Test
    @DisplayName("Aspect throws UnauthorizedException (401) when user has no valid userId in context")
    void testEnforceFeatureAccess_MissingUserId_ThrowsUnauthorizedException() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user", null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        RequireFeature annotation = createRequireFeature("MANUFACTURING");

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                aspect.enforceFeatureAccess(joinPoint, annotation));

        assertTrue(ex.getMessage().contains("missing valid user identity"));
    }

    @Test
    @DisplayName("Aspect allows SYSTEM_ADMIN bypass without calling FeatureAuthorizationService")
    void testEnforceFeatureAccess_SystemAdmin_BypassesFeatureCheck() throws Throwable {
        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setUserRole("SYSTEM_ADMIN");

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin", null, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(joinPoint.proceed()).thenReturn("success");

        RequireFeature annotation = createRequireFeature("MANUFACTURING");
        Object result = aspect.enforceFeatureAccess(joinPoint, annotation);

        assertEquals("success", result);
        verifyNoInteractions(featureAuthorizationService);
    }

    @Test
    @DisplayName("Aspect throws AccessDeniedException (403) when user lacks required feature")
    void testEnforceFeatureAccess_MissingFeature_ThrowsAccessDeniedException() {
        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setUserRole("USER");

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user", null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(featureAuthorizationService.hasFeature(userId, "MANUFACTURING", null)).thenReturn(false);

        RequireFeature annotation = createRequireFeature("MANUFACTURING");

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                aspect.enforceFeatureAccess(joinPoint, annotation));

        assertTrue(ex.getMessage().contains("User lacks required feature permission: MANUFACTURING"));
    }

    @Test
    @DisplayName("Aspect proceeds when user has verified active feature")
    void testEnforceFeatureAccess_HasFeature_Proceeds() throws Throwable {
        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setUserRole("USER");

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user", null, List.of(
                new SimpleGrantedAuthority("ROLE_USER"),
                new SimpleGrantedAuthority("FEATURE_MANUFACTURING")
        ));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(featureAuthorizationService.hasFeature(userId, "MANUFACTURING", null)).thenReturn(true);
        when(joinPoint.proceed()).thenReturn("order_created");

        RequireFeature annotation = createRequireFeature("MANUFACTURING");
        Object result = aspect.enforceFeatureAccess(joinPoint, annotation);

        assertEquals("order_created", result);
        verify(joinPoint).proceed();
    }
}
