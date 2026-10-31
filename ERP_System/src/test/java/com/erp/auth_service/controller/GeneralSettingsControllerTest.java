package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.UpdateGeneralSettingsRequest;
import com.erp.auth_service.dto.request.UpdateLocalizationSettingsRequest;
import com.erp.auth_service.dto.request.UpdateOrganizationSettingsRequest;
import com.erp.auth_service.dto.response.GeneralSettingsResponse;
import com.erp.auth_service.dto.response.LocalizationSettingsResponse;
import com.erp.auth_service.dto.response.OrganizationSettingsResponse;
import com.erp.auth_service.exception.GlobalExceptionHandler;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.GeneralSettingsService;
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
class GeneralSettingsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private GeneralSettingsService generalSettingsService;

    private ObjectMapper objectMapper = new ObjectMapper();

    private UUID orgId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        GeneralSettingsController controller = new GeneralSettingsController(generalSettingsService);
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
    @DisplayName("GET /api/settings/organization returns 200 with organization details")
    void getOrganizationSettingsSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        OrganizationSettingsResponse mockResponse = OrganizationSettingsResponse.builder()
                .organizationId(orgId)
                .companyName("Acme Global Inc.")
                .contactEmail("contact@acmeglobal.com")
                .updatedAt(LocalDateTime.now())
                .build();

        when(generalSettingsService.getOrganizationSettings(orgId)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/settings/organization"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.organizationId").value(orgId.toString()))
                .andExpect(jsonPath("$.data.companyName").value("Acme Global Inc."))
                .andExpect(jsonPath("$.data.contactEmail").value("contact@acmeglobal.com"));

        verify(generalSettingsService).getOrganizationSettings(orgId);
    }

    @Test
    @DisplayName("PUT /api/settings/organization updates company name and contact email")
    void updateOrganizationSettingsSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        UpdateOrganizationSettingsRequest request = UpdateOrganizationSettingsRequest.builder()
                .companyName("Updated Enterprise Ltd")
                .contactEmail("ops@enterprise.com")
                .build();

        OrganizationSettingsResponse mockResponse = OrganizationSettingsResponse.builder()
                .organizationId(orgId)
                .companyName("Updated Enterprise Ltd")
                .contactEmail("ops@enterprise.com")
                .updatedAt(LocalDateTime.now())
                .build();

        when(generalSettingsService.updateOrganizationSettings(eq(orgId), eq(userId), any(UpdateOrganizationSettingsRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/settings/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Organization details updated successfully"))
                .andExpect(jsonPath("$.data.companyName").value("Updated Enterprise Ltd"))
                .andExpect(jsonPath("$.data.contactEmail").value("ops@enterprise.com"));

        verify(generalSettingsService).updateOrganizationSettings(eq(orgId), eq(userId), any(UpdateOrganizationSettingsRequest.class));
    }

    @Test
    @DisplayName("GET /api/settings/localization returns 200 with localization preferences")
    void getLocalizationSettingsSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        LocalizationSettingsResponse mockResponse = LocalizationSettingsResponse.builder()
                .organizationId(orgId)
                .defaultCurrency("INR")
                .timezone("IST")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("12h")
                .updatedAt(LocalDateTime.now())
                .build();

        when(generalSettingsService.getLocalizationSettings(orgId)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/settings/localization"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.defaultCurrency").value("INR"))
                .andExpect(jsonPath("$.data.timezone").value("IST"))
                .andExpect(jsonPath("$.data.dateFormat").value("DD/MM/YYYY"))
                .andExpect(jsonPath("$.data.timeFormat").value("12h"));

        verify(generalSettingsService).getLocalizationSettings(orgId);
    }

    @Test
    @DisplayName("PUT /api/settings/localization updates currency, timezone and formats")
    void updateLocalizationSettingsSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        UpdateLocalizationSettingsRequest request = UpdateLocalizationSettingsRequest.builder()
                .defaultCurrency("USD")
                .timezone("America/New_York")
                .dateFormat("YYYY-MM-DD")
                .timeFormat("24h")
                .build();

        LocalizationSettingsResponse mockResponse = LocalizationSettingsResponse.builder()
                .organizationId(orgId)
                .defaultCurrency("USD")
                .timezone("America/New_York")
                .dateFormat("YYYY-MM-DD")
                .timeFormat("24h")
                .updatedAt(LocalDateTime.now())
                .build();

        when(generalSettingsService.updateLocalizationSettings(eq(orgId), eq(userId), any(UpdateLocalizationSettingsRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/settings/localization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Localization settings updated successfully"))
                .andExpect(jsonPath("$.data.defaultCurrency").value("USD"))
                .andExpect(jsonPath("$.data.timezone").value("America/New_York"))
                .andExpect(jsonPath("$.data.dateFormat").value("YYYY-MM-DD"))
                .andExpect(jsonPath("$.data.timeFormat").value("24h"));

        verify(generalSettingsService).updateLocalizationSettings(eq(orgId), eq(userId), any(UpdateLocalizationSettingsRequest.class));
    }

    @Test
    @DisplayName("GET /api/settings/general returns combined general settings")
    void getGeneralSettingsSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        GeneralSettingsResponse mockResponse = GeneralSettingsResponse.builder()
                .organizationId(orgId)
                .companyName("Acme Global")
                .contactEmail("admin@acmeglobal.com")
                .defaultCurrency("INR")
                .timezone("IST")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("12h")
                .updatedAt(LocalDateTime.now())
                .build();

        when(generalSettingsService.getGeneralSettings(orgId)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/settings/general"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.companyName").value("Acme Global"))
                .andExpect(jsonPath("$.data.defaultCurrency").value("INR"));

        verify(generalSettingsService).getGeneralSettings(orgId);
    }

    @Test
    @DisplayName("PUT /api/settings/general updates combined settings")
    void updateGeneralSettingsSuccess() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        UpdateGeneralSettingsRequest request = UpdateGeneralSettingsRequest.builder()
                .companyName("Acme International")
                .contactEmail("contact@acme.com")
                .defaultCurrency("EUR")
                .timezone("UTC")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("24h")
                .build();

        GeneralSettingsResponse mockResponse = GeneralSettingsResponse.builder()
                .organizationId(orgId)
                .companyName("Acme International")
                .contactEmail("contact@acme.com")
                .defaultCurrency("EUR")
                .timezone("UTC")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("24h")
                .updatedAt(LocalDateTime.now())
                .build();

        when(generalSettingsService.updateGeneralSettings(eq(orgId), eq(userId), any(UpdateGeneralSettingsRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/settings/general")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("General settings updated successfully"))
                .andExpect(jsonPath("$.data.companyName").value("Acme International"))
                .andExpect(jsonPath("$.data.defaultCurrency").value("EUR"));

        verify(generalSettingsService).updateGeneralSettings(eq(orgId), eq(userId), any(UpdateGeneralSettingsRequest.class));
    }

    @Test
    @DisplayName("GET /api/settings/organization without organization context throws 403 Forbidden")
    void getSettingsWithoutOrgContextFails() throws Exception {
        // No RequestContext set
        mockMvc.perform(get("/api/settings/organization"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Organization context required"));

        verify(generalSettingsService, never()).getOrganizationSettings(any());
    }
}

