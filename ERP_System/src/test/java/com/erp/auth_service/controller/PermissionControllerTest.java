package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.AuthorizationCheckRequest;
import com.erp.auth_service.dto.request.GrantPermissionRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.request.RevokePermissionRequest;
import com.erp.auth_service.dto.request.SyncPermissionsRequest;
import com.erp.auth_service.dto.response.AuthorizationCheckResponse;
import com.erp.auth_service.dto.response.FeaturePermissionResponse;
import com.erp.auth_service.dto.response.UserActivePermissionsResponse;
import com.erp.auth_service.dto.response.UserPermissionResponse;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.service.PermissionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PermissionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PermissionService permissionService;

    @Mock
    private JwtDecoder jwtDecoder;

    @InjectMocks
    private PermissionController permissionController;

    private ObjectMapper objectMapper = new ObjectMapper();

    private UUID userId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(permissionController).build();
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("GET /api/sso/permissions - returns all catalog permissions")
    void getAllPermissions_ReturnsOk() throws Exception {
        FeaturePermissionResponse resp = FeaturePermissionResponse.builder()
                .id(UUID.randomUUID())
                .featureCode("PAYMENTS")
                .featureName("Payment Operations")
                .action("READ")
                .permissionCode("PAYMENTS:READ")
                .active(true)
                .build();

        when(permissionService.getAllPermissions()).thenReturn(List.of(resp));

        mockMvc.perform(get("/api/sso/permissions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].permissionCode").value("PAYMENTS:READ"))
                .andExpect(jsonPath("$.data[0].action").value("READ"));
    }

    @Test
    @DisplayName("GET /api/sso/permissions/user/{userId}/active - returns active permissions")
    void getActivePermissions_ReturnsOk() throws Exception {
        UserActivePermissionsResponse resp = UserActivePermissionsResponse.builder()
                .userId(userId)
                .permissions(List.of("PAYMENTS:READ", "PAYMENTS:WRITE"))
                .build();

        when(permissionService.getActivePermissions(userId)).thenReturn(resp);

        mockMvc.perform(get("/api/sso/permissions/user/{userId}/active", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.permissions[0]").value("PAYMENTS:READ"))
                .andExpect(jsonPath("$.data.permissions[1]").value("PAYMENTS:WRITE"));
    }

    @Test
    @DisplayName("POST /api/sso/permissions/user/{userId}/grant - grants permission")
    void grantPermission_ReturnsOk() throws Exception {
        GrantPermissionRequest request = GrantPermissionRequest.builder()
                .featureCode("PAYMENTS")
                .action("READ")
                .build();

        RequestWrapper<GrantPermissionRequest> wrapper = RequestWrapper.<GrantPermissionRequest>builder()
                .data(request)
                .build();

        UserPermissionResponse resp = UserPermissionResponse.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .featureCode("PAYMENTS")
                .action("READ")
                .permissionCode("PAYMENTS:READ")
                .active(true)
                .revoked(false)
                .grantedAt(LocalDateTime.now())
                .build();

        when(permissionService.grantPermission(any(), eq(userId), any(GrantPermissionRequest.class)))
                .thenReturn(resp);

        mockMvc.perform(post("/api/sso/permissions/user/{userId}/grant", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrapper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.permissionCode").value("PAYMENTS:READ"))
                .andExpect(jsonPath("$.data.action").value("READ"));
    }

    @Test
    @DisplayName("POST /api/sso/permissions/user/{userId}/revoke - revokes permission")
    void revokePermission_ReturnsOk() throws Exception {
        RevokePermissionRequest request = RevokePermissionRequest.builder()
                .featureCode("PAYMENTS")
                .action("WRITE")
                .reason("Demoted")
                .build();

        RequestWrapper<RevokePermissionRequest> wrapper = RequestWrapper.<RevokePermissionRequest>builder()
                .data(request)
                .build();

        UserPermissionResponse resp = UserPermissionResponse.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .featureCode("PAYMENTS")
                .action("WRITE")
                .permissionCode("PAYMENTS:WRITE")
                .active(false)
                .revoked(true)
                .revokeReason("Demoted")
                .build();

        when(permissionService.revokePermission(any(), eq(userId), any(RevokePermissionRequest.class)))
                .thenReturn(resp);

        mockMvc.perform(post("/api/sso/permissions/user/{userId}/revoke", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrapper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.revoked").value(true))
                .andExpect(jsonPath("$.data.permissionCode").value("PAYMENTS:WRITE"));
    }

    @Test
    @DisplayName("POST /internal/authorization/check - verifies permission")
    void checkPermission_ReturnsOk() throws Exception {
        AuthorizationCheckRequest request = AuthorizationCheckRequest.builder()
                .userId(userId)
                .featureCode("PAYMENTS")
                .action("READ")
                .serviceName("account-service")
                .build();

        RequestWrapper<AuthorizationCheckRequest> wrapper = RequestWrapper.<AuthorizationCheckRequest>builder()
                .data(request)
                .build();

        AuthorizationCheckResponse resp = AuthorizationCheckResponse.builder()
                .allowed(true)
                .permissionCode("PAYMENTS:READ")
                .reason("Permission granted")
                .build();

        when(permissionService.checkPermission(any(AuthorizationCheckRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/internal/authorization/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrapper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.allowed").value(true))
                .andExpect(jsonPath("$.data.permissionCode").value("PAYMENTS:READ"));
    }
}
