package com.erp.auth_service.security;

import com.erp.auth_service.controller.FeatureController;
import com.erp.auth_service.controller.PermissionController;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.model.Session;
import com.erp.auth_service.model.User;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.service.AuthService;
import com.erp.auth_service.service.FeatureService;
import com.erp.auth_service.service.PermissionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerSecurityAuditRegressionTest {

    @Mock private JwtDecoder jwtDecoder;

    private PermissionController permissionController;
    private FeatureController featureController;

    private UUID callerUserId;
    private UUID victimUserId;
    private String callerTokenHeader;

    @BeforeEach
    void setUp() {
        permissionController = new PermissionController(null, jwtDecoder);
        featureController = new FeatureController(null, jwtDecoder);

        callerUserId = UUID.randomUUID();
        victimUserId = UUID.randomUUID();
        callerTokenHeader = "Bearer mock.caller.token";
    }

    @Test
    @DisplayName("Permissions: caller requesting another user's effective permissions is rejected with ForbiddenException")
    void permissions_CrossUserSpoofing_Rejected() {
        when(jwtDecoder.extractUserId("mock.caller.token")).thenReturn(callerUserId);

        assertThrows(ForbiddenException.class, () ->
                permissionController.getEffectivePermissions(victimUserId, callerTokenHeader, null));
    }

    @Test
    @DisplayName("Permissions: caller requesting another user's active permissions is rejected with ForbiddenException")
    void permissions_ActivePermissions_CrossUserSpoofing_Rejected() {
        when(jwtDecoder.extractUserId("mock.caller.token")).thenReturn(callerUserId);

        assertThrows(ForbiddenException.class, () ->
                permissionController.getActivePermissions(victimUserId, callerTokenHeader, null));
    }

    @Test
    @DisplayName("Permissions: caller requesting another user's assigned permissions is rejected with ForbiddenException")
    void permissions_UserPermissions_CrossUserSpoofing_Rejected() {
        when(jwtDecoder.extractUserId("mock.caller.token")).thenReturn(callerUserId);

        assertThrows(ForbiddenException.class, () ->
                permissionController.getUserPermissions(victimUserId, callerTokenHeader, null));
    }

    @Test
    @DisplayName("Features: caller requesting another user's assigned features is rejected with ForbiddenException")
    void features_UserFeatures_CrossUserSpoofing_Rejected() {
        when(jwtDecoder.extractUserId("mock.caller.token")).thenReturn(callerUserId);

        assertThrows(ForbiddenException.class, () ->
                featureController.getUserFeatures(victimUserId, callerTokenHeader, null));
    }

    @Test
    @DisplayName("Features: caller requesting another user's active features is rejected with ForbiddenException")
    void features_ActiveFeatures_CrossUserSpoofing_Rejected() {
        when(jwtDecoder.extractUserId("mock.caller.token")).thenReturn(callerUserId);

        assertThrows(ForbiddenException.class, () ->
                featureController.getActiveFeatures(victimUserId, callerTokenHeader, null));
    }

    @Test
    @DisplayName("Permissions: caller with invalid or unresolvable token is rejected with ForbiddenException")
    void permissions_InvalidToken_ThrowsForbiddenException() {
        when(jwtDecoder.extractUserId("mock.bad.token")).thenThrow(new RuntimeException("invalid token"));

        assertThrows(ForbiddenException.class, () ->
                permissionController.getEffectivePermissions(victimUserId, "Bearer mock.bad.token", null));
    }

    @Test
    @DisplayName("Features: caller with invalid or unresolvable token is rejected with ForbiddenException")
    void features_InvalidToken_ThrowsForbiddenException() {
        when(jwtDecoder.extractUserId("mock.bad.token")).thenThrow(new RuntimeException("invalid token"));

        assertThrows(ForbiddenException.class, () ->
                featureController.getActiveFeatures(victimUserId, "Bearer mock.bad.token", null));
    }
}
