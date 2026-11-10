package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.UpdateOrganizationAppearanceRequest;
import com.erp.auth_service.dto.response.OrganizationAppearanceResponse;
import com.erp.auth_service.exception.GlobalExceptionHandler;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationAppearanceService;
import com.erp.auth_service.utility.AccessMode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class OrganizationAppearanceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrganizationAppearanceService appearanceService;

    private ObjectMapper objectMapper = new ObjectMapper();

    private UUID orgId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        OrganizationAppearanceController controller = new OrganizationAppearanceController(appearanceService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        orgId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    @Test
    @DisplayName("GET /api/sso/organization/appearance returns 200 with active organization settings")
    void getAppearanceSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        OrganizationAppearanceResponse mockResponse = OrganizationAppearanceResponse.builder()
                .organizationId(orgId)
                .organizationCode("ALPHA")
                .activeTheme("ocean")
                .appearanceMode("light")
                .layoutDensity("comfortable")
                .fontFamily("default")
                .updatedAt(LocalDateTime.now())
                .build();

        when(appearanceService.getAppearance(orgId)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/sso/organization/appearance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.organizationId").value(orgId.toString()))
                .andExpect(jsonPath("$.data.organizationCode").value("ALPHA"))
                .andExpect(jsonPath("$.data.activeTheme").value("ocean"))
                .andExpect(jsonPath("$.data.appearanceMode").value("light"));

        verify(appearanceService).getAppearance(orgId);
    }

    @Test
    @DisplayName("GET /api/sso/organization/appearance without organization context throws 403 Forbidden")
    void getAppearanceWithoutOrgContextFails() throws Exception {
        // No RequestContext set
        mockMvc.perform(get("/api/sso/organization/appearance"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Organization context required"));

        verify(appearanceService, never()).getAppearance(any());
    }

    @Test
    @DisplayName("PUT /api/sso/organization/appearance updates appearance settings")
    void updateAppearanceSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        UpdateOrganizationAppearanceRequest request = UpdateOrganizationAppearanceRequest.builder()
                .activeTheme("lavender")
                .appearanceMode("dark")
                .layoutDensity("compact")
                .build();

        OrganizationAppearanceResponse mockResponse = OrganizationAppearanceResponse.builder()
                .organizationId(orgId)
                .organizationCode("ALPHA")
                .activeTheme("lavender")
                .appearanceMode("dark")
                .layoutDensity("compact")
                .fontFamily("default")
                .build();

        when(appearanceService.updateAppearance(eq(orgId), eq(userId), any(UpdateOrganizationAppearanceRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/sso/organization/appearance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Appearance settings updated successfully"))
                .andExpect(jsonPath("$.data.activeTheme").value("lavender"))
                .andExpect(jsonPath("$.data.appearanceMode").value("dark"));

        verify(appearanceService).updateAppearance(eq(orgId), eq(userId), any(UpdateOrganizationAppearanceRequest.class));
    }

    @Test
    @DisplayName("POST /api/sso/organization/appearance/reset resets appearance settings to default")
    void resetAppearanceSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        OrganizationAppearanceResponse mockResponse = OrganizationAppearanceResponse.defaultFor(orgId, "ALPHA");

        when(appearanceService.resetAppearance(orgId, userId)).thenReturn(mockResponse);

        mockMvc.perform(post("/api/sso/organization/appearance/reset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Appearance settings reset to default"))
                .andExpect(jsonPath("$.data.activeTheme").value("sage"))
                .andExpect(jsonPath("$.data.appearanceMode").value("system"));

        verify(appearanceService).resetAppearance(orgId, userId);
    }

    @Test
    @DisplayName("POST /api/sso/organization/appearance/upload-asset handles multipart branding asset upload")
    void uploadAssetSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        org.springframework.mock.web.MockMultipartFile file =
                new org.springframework.mock.web.MockMultipartFile("file", "logo.png", "image/png", "sample data".getBytes());

        java.util.Map<String, Object> mockResult = java.util.Map.of(
                "assetUrl", "https://cdn.example.com/logo.png",
                "assetType", "light_logo"
        );

        when(appearanceService.uploadAsset(eq(orgId), eq(userId), any(), eq("light_logo")))
                .thenReturn(mockResult);

        mockMvc.perform(multipart("/api/sso/organization/appearance/upload-asset")
                        .file(file)
                        .param("assetType", "light_logo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.assetUrl").value("https://cdn.example.com/logo.png"));

        verify(appearanceService).uploadAsset(eq(orgId), eq(userId), any(), eq("light_logo"));
    }
}

