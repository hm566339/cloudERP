package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.*;
import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.exception.GlobalExceptionHandler;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationSettingsService;
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
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class OrganizationSettingsControllerTest {

        private MockMvc mockMvc;

        @Mock
        private OrganizationSettingsService settingsService;

        private final ObjectMapper objectMapper = new ObjectMapper();

        private UUID orgId;
        private UUID userId;
        private UUID companyId;

        @BeforeEach
        void setUp() {
                OrganizationSettingsController controller = new OrganizationSettingsController(settingsService);
                mockMvc = MockMvcBuilders.standaloneSetup(controller)
                                .setControllerAdvice(new GlobalExceptionHandler())
                                .build();

                orgId = UUID.randomUUID();
                userId = UUID.randomUUID();
                companyId = UUID.randomUUID();
        }

        @AfterEach
        void tearDown() {
                RequestContext.clear();
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 1. Profile
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("GET /api/organization/profile returns profile successfully")
        void getProfileSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                OrganizationProfileResponse mockResponse = OrganizationProfileResponse.builder()
                                .id(orgId)
                                .name("Acme Corp")
                                .code("ACME")
                                .primaryEmail("admin@acme.com")
                                .createdAt(LocalDateTime.now())
                                .build();

                when(settingsService.getProfile(orgId, userId)).thenReturn(mockResponse);

                mockMvc.perform(get("/api/organization/profile"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.name").value("Acme Corp"))
                                .andExpect(jsonPath("$.data.code").value("ACME"))
                                .andExpect(jsonPath("$.data.primaryEmail").value("admin@acme.com"));

                verify(settingsService).getProfile(orgId, userId);
        }

        @Test
        @DisplayName("GET /api/organization/profile without context returns 403 Forbidden")
        void getProfileWithoutContextFails() throws Exception {
                mockMvc.perform(get("/api/organization/profile"))
                                .andExpect(status().isForbidden());

                verify(settingsService, never()).getProfile(any(), any());
        }

        @Test
        @DisplayName("PUT /api/organization/profile updates name and email successfully")
        void updateProfileSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                UpdateOrganizationProfileRequest req = new UpdateOrganizationProfileRequest();
                req.setName("Acme Global");
                req.setPrimaryEmail("contact@acme.com");

                OrganizationProfileResponse mockResponse = OrganizationProfileResponse.builder()
                                .id(orgId)
                                .name("Acme Global")
                                .code("ACME")
                                .primaryEmail("contact@acme.com")
                                .build();

                when(settingsService.updateProfile(eq(orgId), eq(userId), any(UpdateOrganizationProfileRequest.class)))
                                .thenReturn(mockResponse);

                mockMvc.perform(put("/api/organization/profile")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.name").value("Acme Global"))
                                .andExpect(jsonPath("$.data.primaryEmail").value("contact@acme.com"));

                verify(settingsService).updateProfile(eq(orgId), eq(userId),
                                any(UpdateOrganizationProfileRequest.class));
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 2. Login Portal
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("GET /api/organization/login-portal returns portal metadata")
        void getLoginPortalSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                OrganizationLoginPortalResponse mockResponse = OrganizationLoginPortalResponse.builder()
                                .loginUrl("https://login.mark2.in/acme")
                                .previewUrl("https://login.mark2.in/acme?preview=true")
                                .slug("acme")
                                .organizationCode("ACME")
                                .status("ACTIVE")
                                .build();

                when(settingsService.getLoginPortal(orgId, userId)).thenReturn(mockResponse);

                mockMvc.perform(get("/api/organization/login-portal"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.slug").value("acme"))
                                .andExpect(jsonPath("$.data.loginUrl").value("https://login.mark2.in/acme"));

                verify(settingsService).getLoginPortal(orgId, userId);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 3. Regional Settings
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("GET /api/organization/regional-settings returns regional preferences")
        void getRegionalSettingsSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                OrganizationRegionalSettingsResponse mockResponse = OrganizationRegionalSettingsResponse.builder()
                                .currency("INR")
                                .timezone("Asia/Kolkata")
                                .fiscalYearStartMonth("April")
                                .dateFormat("DD/MM/YYYY")
                                .timeFormat("12-hour")
                                .build();

                when(settingsService.getRegionalSettings(orgId, userId)).thenReturn(mockResponse);

                mockMvc.perform(get("/api/organization/regional-settings"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.currency").value("INR"))
                                .andExpect(jsonPath("$.data.fiscalYearStartMonth").value("April"));

                verify(settingsService).getRegionalSettings(orgId, userId);
        }

        @Test
        @DisplayName("PUT /api/organization/regional-settings updates regional preferences")
        void updateRegionalSettingsSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                UpdateRegionalSettingsRequest req = new UpdateRegionalSettingsRequest();
                req.setCurrency("USD");
                req.setTimezone("America/New_York");
                req.setFiscalYearStartMonth("January");
                req.setDateFormat("YYYY-MM-DD");
                req.setTimeFormat("24-hour");

                OrganizationRegionalSettingsResponse mockResponse = OrganizationRegionalSettingsResponse.builder()
                                .currency("USD")
                                .timezone("America/New_York")
                                .fiscalYearStartMonth("January")
                                .dateFormat("YYYY-MM-DD")
                                .timeFormat("24-hour")
                                .build();

                when(settingsService.updateRegionalSettings(eq(orgId), eq(userId),
                                any(UpdateRegionalSettingsRequest.class)))
                                .thenReturn(mockResponse);

                mockMvc.perform(put("/api/organization/regional-settings")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.currency").value("USD"))
                                .andExpect(jsonPath("$.data.fiscalYearStartMonth").value("January"));

                verify(settingsService).updateRegionalSettings(eq(orgId), eq(userId),
                                any(UpdateRegionalSettingsRequest.class));
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 4. Security Settings
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("GET /api/organization/security returns security preferences")
        void getSecuritySettingsSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                OrganizationSecuritySettingsResponse mockResponse = OrganizationSecuritySettingsResponse.builder()
                                .enforce2FA(true)
                                .sessionTimeoutMinutes(30)
                                .build();

                when(settingsService.getSecuritySettings(orgId, userId)).thenReturn(mockResponse);

                mockMvc.perform(get("/api/organization/security"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.enforce2FA").value(true))
                                .andExpect(jsonPath("$.data.sessionTimeoutMinutes").value(30));

                verify(settingsService).getSecuritySettings(orgId, userId);
        }

        @Test
        @DisplayName("PUT /api/organization/security updates security settings")
        void updateSecuritySettingsSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                UpdateSecuritySettingsRequest req = new UpdateSecuritySettingsRequest();
                req.setEnforce2FA(false);
                req.setSessionTimeoutMinutes(60);

                OrganizationSecuritySettingsResponse mockResponse = OrganizationSecuritySettingsResponse.builder()
                                .enforce2FA(false)
                                .sessionTimeoutMinutes(60)
                                .build();

                when(settingsService.updateSecuritySettings(eq(orgId), eq(userId),
                                any(UpdateSecuritySettingsRequest.class)))
                                .thenReturn(mockResponse);

                mockMvc.perform(put("/api/organization/security")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.enforce2FA").value(false))
                                .andExpect(jsonPath("$.data.sessionTimeoutMinutes").value(60));

                verify(settingsService).updateSecuritySettings(eq(orgId), eq(userId),
                                any(UpdateSecuritySettingsRequest.class));
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 5. Multi-Company Management
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("GET /api/organization/companies returns list of companies")
        void getCompaniesSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                OrganizationCompanyResponse comp = OrganizationCompanyResponse.builder()
                                .id(companyId)
                                .companyName("HQ Corp")
                                .companyCode("HQ")
                                .active(true)
                                .baseCurrency("INR")
                                .build();

                OrganizationCompanyListResponse listResponse = OrganizationCompanyListResponse.builder()
                                .companies(List.of(comp))
                                .totalCount(1)
                                .activeCount(1)
                                .build();

                when(settingsService.getCompanies(orgId, userId)).thenReturn(listResponse);

                mockMvc.perform(get("/api/organization/companies"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.companies[0].companyName").value("HQ Corp"))
                                .andExpect(jsonPath("$.data.totalCount").value(1));

                verify(settingsService).getCompanies(orgId, userId);
        }

        @Test
        @DisplayName("POST /api/organization/companies creates a new company")
        void createCompanySuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                CreateOrganizationCompanyRequest req = new CreateOrganizationCompanyRequest();
                req.setCompanyName("Branch South");
                req.setCompanyCode("BRS");
                req.setCity("Chennai");
                req.setCountry("India");

                OrganizationCompanyResponse comp = OrganizationCompanyResponse.builder()
                                .id(companyId)
                                .companyName("Branch South")
                                .companyCode("BRS")
                                .city("Chennai")
                                .active(true)
                                .build();

                when(settingsService.createCompany(eq(orgId), eq(userId), any(CreateOrganizationCompanyRequest.class)))
                                .thenReturn(comp);

                mockMvc.perform(post("/api/organization/companies")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.companyName").value("Branch South"))
                                .andExpect(jsonPath("$.data.companyCode").value("BRS"));

                verify(settingsService).createCompany(eq(orgId), eq(userId),
                                any(CreateOrganizationCompanyRequest.class));
        }

        @Test
        @DisplayName("DELETE /api/organization/companies/{id} deactivates company")
        void deleteCompanySuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                doNothing().when(settingsService).deleteCompany(orgId, companyId, userId);

                mockMvc.perform(delete("/api/organization/companies/" + companyId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.message").value("Company archived successfully"));

                verify(settingsService).deleteCompany(orgId, companyId, userId);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 6. Subscription
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("GET /api/organization/subscription returns subscription details")
        void getSubscriptionSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                OrganizationSubscriptionResponse mockResponse = OrganizationSubscriptionResponse.builder()
                                .planName("ENTERPRISE")
                                .status("ACTIVE")
                                .companyLimit(10)
                                .build();

                when(settingsService.getSubscription(orgId, userId)).thenReturn(mockResponse);

                mockMvc.perform(get("/api/organization/subscription"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.planName").value("ENTERPRISE"));

                verify(settingsService).getSubscription(orgId, userId);
        }

        @Test
        @DisplayName("GET /api/organization/subscription/usage returns plan usage metrics")
        void getSubscriptionUsageSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                OrganizationSubscriptionUsageResponse mockResponse = OrganizationSubscriptionUsageResponse.builder()
                                .activeCompanies(2)
                                .totalCompanies(2)
                                .companyLimit(5)
                                .activeMembers(12)
                                .storageUsed("4.5 GB")
                                .storageLimit("50 GB")
                                .build();

                when(settingsService.getSubscriptionUsage(orgId, userId)).thenReturn(mockResponse);

                mockMvc.perform(get("/api/organization/subscription/usage"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.activeCompanies").value(2))
                                .andExpect(jsonPath("$.data.companyLimit").value(5));

                verify(settingsService).getSubscriptionUsage(orgId, userId);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 7. Modules
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("GET /api/organization/modules returns entitled modules")
        void getModulesSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                OrganizationModuleItemResponse mod = OrganizationModuleItemResponse.builder()
                                .key("INVENTORY")
                                .name("Inventory Management")
                                .enabled(true)
                                .build();

                OrganizationModulesResponse mockResponse = OrganizationModulesResponse.builder()
                                .modules(List.of(mod))
                                .build();

                when(settingsService.getModules(orgId, userId)).thenReturn(mockResponse);

                mockMvc.perform(get("/api/organization/modules"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.modules[0].key").value("INVENTORY"));

                verify(settingsService).getModules(orgId, userId);
        }

        @Test
        @DisplayName("PUT /api/organization/modules updates enabled modules")
        void updateModulesSuccess() throws Exception {
                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                UpdateOrganizationModulesRequest req = new UpdateOrganizationModulesRequest();
                req.setModuleKeys(List.of("INVENTORY", "ACCOUNTING"));

                OrganizationModuleItemResponse mod1 = OrganizationModuleItemResponse.builder()
                                .key("INVENTORY")
                                .enabled(true)
                                .build();
                OrganizationModuleItemResponse mod2 = OrganizationModuleItemResponse.builder()
                                .key("ACCOUNTING")
                                .enabled(true)
                                .build();

                OrganizationModulesResponse mockResponse = OrganizationModulesResponse.builder()
                                .modules(List.of(mod1, mod2))
                                .build();

                when(settingsService.updateModules(eq(orgId), eq(userId), any(UpdateOrganizationModulesRequest.class)))
                                .thenReturn(mockResponse);

                mockMvc.perform(put("/api/organization/modules")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.modules").isArray());

                verify(settingsService).updateModules(eq(orgId), eq(userId),
                                any(UpdateOrganizationModulesRequest.class));
        }
}
