package com.erp.account.security.feature;

import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.security.annotation.RequireFeature;
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
        lenient().when(signature.toShortString()).thenReturn("PaymentVoucherController.create()");
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Aspect throws UnauthorizedException (401) when user is unauthenticated")
    void testEnforceFeatureAccess_Unauthenticated_ThrowsUnauthorizedException() {
        RequireFeature annotation = createRequireFeature("PAYMENTS");

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

        RequireFeature annotation = createRequireFeature("PAYMENTS");

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                aspect.enforceFeatureAccess(joinPoint, annotation));

        assertTrue(ex.getMessage().contains("missing valid user identity"));
    }

    @Test
    @DisplayName("Aspect allows SYSTEM_ADMIN to proceed without feature check")
    void testEnforceFeatureAccess_SystemAdmin_BypassesCheck() throws Throwable {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin", null, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserId(userId);

        when(joinPoint.proceed()).thenReturn("SUCCESS");

        RequireFeature annotation = createRequireFeature("PAYMENTS");
        Object result = aspect.enforceFeatureAccess(joinPoint, annotation);

        assertEquals("SUCCESS", result);
        verify(joinPoint, times(1)).proceed();
        verifyNoInteractions(featureAuthorizationService);
    }

    @Test
    @DisplayName("Aspect allows user with active feature permission to proceed")
    void testEnforceFeatureAccess_UserWithFeature_Proceeds() throws Throwable {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "accountant", null, List.of(new SimpleGrantedAuthority("ROLE_ACCOUNTANT")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserId(userId);

        when(featureAuthorizationService.hasFeature(eq(userId), eq("PAYMENTS"), any()))
                .thenReturn(true);
        when(joinPoint.proceed()).thenReturn("SUCCESS");

        RequireFeature annotation = createRequireFeature("PAYMENTS");
        Object result = aspect.enforceFeatureAccess(joinPoint, annotation);

        assertEquals("SUCCESS", result);
        verify(joinPoint, times(1)).proceed();
    }

    @Test
    @DisplayName("Aspect throws AccessDeniedException (403) when user lacks feature permission")
    void testEnforceFeatureAccess_UserWithoutFeature_ThrowsAccessDeniedException() throws Throwable {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "accountant", null, List.of(new SimpleGrantedAuthority("ROLE_ACCOUNTANT")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserId(userId);

        when(featureAuthorizationService.hasFeature(eq(userId), eq("PAYMENTS"), any()))
                .thenReturn(false);

        RequireFeature annotation = createRequireFeature("PAYMENTS");

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                aspect.enforceFeatureAccess(joinPoint, annotation));

        assertTrue(ex.getMessage().contains("User lacks required feature permission"));
        verify(joinPoint, never()).proceed();
    }

    @Test
    @DisplayName("Aspect throws AccessDeniedException (403) fail closed when authorization service fails")
    void testEnforceFeatureAccess_SsoServiceDown_FailsClosed() throws Throwable {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "accountant", null, List.of(new SimpleGrantedAuthority("ROLE_ACCOUNTANT")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserId(userId);

        when(featureAuthorizationService.hasFeature(eq(userId), eq("PAYMENTS"), any()))
                .thenThrow(new AccessDeniedException("Authorization service unavailable"));

        RequireFeature annotation = createRequireFeature("PAYMENTS");

        assertThrows(AccessDeniedException.class, () ->
                aspect.enforceFeatureAccess(joinPoint, annotation));

        verify(joinPoint, never()).proceed();
    }
}
