package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.GrantFeatureRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.request.RevokeFeatureRequest;
import com.erp.auth_service.dto.request.SyncUserFeaturesRequest;
import com.erp.auth_service.dto.response.FeatureResponse;
import com.erp.auth_service.dto.response.UserActiveFeaturesResponse;
import com.erp.auth_service.dto.response.UserFeatureResponse;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.service.FeatureService;
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
class FeatureControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FeatureService featureService;

    @Mock
    private JwtDecoder jwtDecoder;

    @InjectMocks
    private FeatureController featureController;

    private ObjectMapper objectMapper = new ObjectMapper();

    private UUID userId;
    private UUID featureId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(featureController).build();
        userId = UUID.randomUUID();
        featureId = UUID.randomUUID();
    }

    @Test
    @DisplayName("GET /api/sso/features returns catalog list")
    void testGetAllFeatures_ReturnsOk() throws Exception {
        FeatureResponse f1 = FeatureResponse.builder()
                .id(featureId)
                .code("PAYMENTS")
                .name("Payments")
                .moduleName("ACCOUNT")
                .active(true)
                .build();

        when(featureService.getAllFeatures()).thenReturn(List.of(f1));

        mockMvc.perform(get("/api/sso/features"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].code").value("PAYMENTS"));
    }

    @Test
    @DisplayName("GET /api/sso/features/user/{userId}/active returns active feature codes")
    void testGetActiveFeatures_ReturnsOk() throws Exception {
        UserActiveFeaturesResponse activeResp = UserActiveFeaturesResponse.builder()
                .userId(userId)
                .username("john")
                .activeFeatures(List.of("PAYMENTS", "REPORTS"))
                .build();

        when(featureService.getActiveFeatures(userId)).thenReturn(activeResp);

        mockMvc.perform(get("/api/sso/features/user/{userId}/active", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.activeFeatures[0]").value("PAYMENTS"))
                .andExpect(jsonPath("$.data.activeFeatures[1]").value("REPORTS"));
    }

    @Test
    @DisplayName("POST /api/sso/features/user/{userId}/grant grants feature")
    void testGrantFeature_ReturnsOk() throws Exception {
        GrantFeatureRequest grantReq = GrantFeatureRequest.builder()
                .featureCode("PAYMENTS")
                .build();

        RequestWrapper<GrantFeatureRequest> reqWrapper = RequestWrapper.<GrantFeatureRequest>builder()
                .data(grantReq)
                .build();

        UserFeatureResponse resp = UserFeatureResponse.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .featureCode("PAYMENTS")
                .active(true)
                .revoked(false)
                .grantedAt(LocalDateTime.now())
                .build();

        when(featureService.grantFeature(any(), eq(userId), any())).thenReturn(resp);

        mockMvc.perform(post("/api/sso/features/user/{userId}/grant", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqWrapper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.featureCode").value("PAYMENTS"))
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    @DisplayName("POST /api/sso/features/user/{userId}/revoke revokes feature")
    void testRevokeFeature_ReturnsOk() throws Exception {
        RevokeFeatureRequest revokeReq = RevokeFeatureRequest.builder()
                .featureCode("PAYMENTS")
                .reason("Revoked for testing")
                .build();

        RequestWrapper<RevokeFeatureRequest> reqWrapper = RequestWrapper.<RevokeFeatureRequest>builder()
                .data(revokeReq)
                .build();

        UserFeatureResponse resp = UserFeatureResponse.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .featureCode("PAYMENTS")
                .active(false)
                .revoked(true)
                .revokeReason("Revoked for testing")
                .build();

        when(featureService.revokeFeature(any(), eq(userId), any())).thenReturn(resp);

        mockMvc.perform(post("/api/sso/features/user/{userId}/revoke", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqWrapper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.featureCode").value("PAYMENTS"))
                .andExpect(jsonPath("$.data.revoked").value(true))
                .andExpect(jsonPath("$.data.active").value(false));
    }

    @Test
    @DisplayName("PUT /api/sso/features/user/{userId}/sync synchronizes features")
    void testSyncFeatures_ReturnsOk() throws Exception {
        SyncUserFeaturesRequest syncReq = SyncUserFeaturesRequest.builder()
                .featureCodes(List.of("REPORTS"))
                .build();

        RequestWrapper<SyncUserFeaturesRequest> reqWrapper = RequestWrapper.<SyncUserFeaturesRequest>builder()
                .data(syncReq)
                .build();

        UserFeatureResponse resp = UserFeatureResponse.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .featureCode("REPORTS")
                .active(true)
                .build();

        when(featureService.syncUserFeatures(any(), eq(userId), any())).thenReturn(List.of(resp));

        mockMvc.perform(put("/api/sso/features/user/{userId}/sync", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqWrapper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].featureCode").value("REPORTS"));
    }

    @Test
    @DisplayName("GET /api/sso/features/{id} returns feature by id")
    void testGetFeatureById_ReturnsOk() throws Exception {
        FeatureResponse resp = FeatureResponse.builder()
                .id(featureId)
                .code("INVENTORY")
                .name("Inventory Management")
                .moduleName("ERP")
                .active(true)
                .build();

        when(featureService.getFeatureById(featureId)).thenReturn(resp);

        mockMvc.perform(get("/api/sso/features/{id}", featureId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("INVENTORY"));
    }

    @Test
    @DisplayName("PUT /api/sso/features/{id} updates feature")
    void testUpdateFeature_ReturnsOk() throws Exception {
        com.erp.auth_service.dto.request.UpdateFeatureRequest updateReq = com.erp.auth_service.dto.request.UpdateFeatureRequest.builder()
                .name("Updated Inventory")
                .active(true)
                .build();

        RequestWrapper<com.erp.auth_service.dto.request.UpdateFeatureRequest> reqWrapper = RequestWrapper.<com.erp.auth_service.dto.request.UpdateFeatureRequest>builder()
                .data(updateReq)
                .build();

        FeatureResponse resp = FeatureResponse.builder()
                .id(featureId)
                .code("INVENTORY")
                .name("Updated Inventory")
                .active(true)
                .build();

        when(featureService.updateFeature(eq(featureId), any())).thenReturn(resp);

        mockMvc.perform(put("/api/sso/features/{id}", featureId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqWrapper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Updated Inventory"));
    }

    @Test
    @DisplayName("DELETE /api/sso/features/{id} deletes feature")
    void testDeleteFeature_ReturnsOk() throws Exception {
        when(featureService.deleteFeature(featureId)).thenReturn(new com.erp.auth_service.dto.response.MessageResponse("Feature deleted successfully"));

        mockMvc.perform(delete("/api/sso/features/{id}", featureId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").value("Feature deleted successfully"));
    }
}
