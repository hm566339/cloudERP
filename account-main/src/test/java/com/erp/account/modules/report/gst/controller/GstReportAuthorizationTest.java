package com.erp.account.modules.report.gst.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.common.handler.GlobalExceptionHandler;
import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import com.erp.account.modules.report.gst.dto.GstSummaryDto;
import com.erp.account.modules.report.gst.dto.ReportSummaryDto;
import com.erp.account.modules.report.gst.dto.TaxSummaryDto;
import com.erp.account.modules.report.gst.exporter.ReportExporter;
import com.erp.account.modules.report.gst.facade.GstReportFacade;
import com.erp.account.modules.report.gst.service.Gstr2bReconciliationService;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.security.authorization.AuthenticatedUser;
import com.erp.account.security.authorization.FeatureGroupPermissionResolver;
import com.erp.account.security.authorization.SsoAuthorizationManager;
import com.erp.account.security.authorization.SsoAuthorizationProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class GstReportAuthorizationTest {

    @Mock
    private GstReportFacade facade;

    @Mock
    private ReportExporter exporter;

    @Mock
    private Gstr2bReconciliationService gstr2bReconciliationService;

    @InjectMocks
    private GstReportController controller;

    private MockMvc mockMvc;

    private SsoAuthorizationProperties properties;
    private SsoAuthorizationManager authorizationManager;

    private static final UUID TARGET_COMPANY_ID = UUID.fromString("ea811382-0afc-4908-a209-9bedcc63c445");
    private static final UUID OTHER_COMPANY_ID = UUID.fromString("11111111-2222-3333-4444-555555555555");
    private static final UUID ORG_ID = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        // Configure SsoAuthorizationProperties matching application-sso-auth.yml
        properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "GST_REPORTS", List.of(
                        "/api/reports/gst/**",
                        "/api/account/reports/gst/**",
                        "/api/account/gst/ledger/**",
                        "/api/gst/ecl/**",
                        "/api/gst/gstr2b/**"
                ),
                "REPORTS", List.of(
                        "/api/account/reports",
                        "/api/account/reports/**",
                        "/api/account/v1/reports",
                        "/api/account/v1/reports/**",
                        "/api/account/reports/cash-flow/**"
                ),
                "CUSTOMERS", List.of("/api/account/customers/**")
        ));

        properties.setFeatureGroups(Map.of(
                "GST_REPORTS", Map.of("GST_REPORTS", List.of("READ", "EXPORT"))
        ));

        FeatureGroupPermissionResolver resolver = new FeatureGroupPermissionResolver(properties);
        authorizationManager = new SsoAuthorizationManager(properties, resolver);

        CurrentUserContext.clearAll();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clearAll();
        SecurityContextHolder.clearContext();
    }

    private PermissionResponse permission(String module, String action, Boolean active, Boolean allowed) {
        return PermissionResponse.builder()
                .permissionCode(module + ":" + action)
                .action(action)
                .moduleName(module)
                .featureCode(module)
                .active(active)
                .allowed(allowed)
                .build();
    }

    private AuthorizationDecision decide(AuthenticatedUser user, String method, String uri) {
        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .toList();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user, null, authorities);
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        return authorizationManager.authorize(() -> auth, new RequestAuthorizationContext(request, null));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. Authorization Manager Tests: Specificity, Suffix, and Permissions
    // ─────────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("OWNER with GST_REPORTS:READ permission is granted access to POST /api/account/reports/gst/summary")
    void ownerWithGstReportsReadIsGranted() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("owner@test.com")
                .organizationId(ORG_ID)
                .roles(List.of("OWNER"))
                .activeFeatures(Set.of("GST_REPORTS"))
                .permissions(List.of(permission("GST_REPORTS", "READ", true, true)))
                .build();

        AuthorizationDecision decision = decide(user, "POST", "/api/account/reports/gst/summary");
        assertThat(decision).isNotNull();
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("User with active GST_REPORTS feature group is granted READ via group-derived permissions")
    void userWithGstReportsFeatureGroupIsGranted() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("accountant@test.com")
                .organizationId(ORG_ID)
                .roles(List.of("ACCOUNTANT"))
                .activeFeatures(Set.of("GST_REPORTS"))
                .permissions(List.of())
                .build();

        AuthorizationDecision decision = decide(user, "POST", "/api/account/reports/gst/summary");
        assertThat(decision).isNotNull();
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("User without GST_REPORTS permission or feature receives access denied (403)")
    void userWithoutGstReportsPermissionIsDenied() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("viewer@test.com")
                .organizationId(ORG_ID)
                .roles(List.of("VIEWER"))
                .activeFeatures(Set.of())
                .permissions(List.of(permission("CUSTOMERS", "READ", true, true)))
                .build();

        AuthorizationDecision decision = decide(user, "POST", "/api/account/reports/gst/summary");
        assertThat(decision).isNotNull();
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("AntPath specificity: GST reports URL resolves to GST_REPORTS module rather than broader REPORTS module")
    void gstReportUrlRoutesToGstReportsModuleNotReports() {
        // User holds GST_REPORTS:READ, but DOES NOT hold general REPORTS:READ
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("gstuser@test.com")
                .organizationId(ORG_ID)
                .roles(List.of("ACCOUNTANT"))
                .activeFeatures(Set.of())
                .permissions(List.of(permission("GST_REPORTS", "READ", true, true)))
                .build();

        // /api/account/reports/gst/summary must match GST_REPORTS and grant access
        AuthorizationDecision decision = decide(user, "POST", "/api/account/reports/gst/summary");
        assertThat(decision.isGranted()).isTrue();

        // But general report /api/account/reports/trial-balance requires REPORTS permission, so denied
        AuthorizationDecision generalReportDecision = decide(user, "GET", "/api/account/reports/trial-balance");
        assertThat(generalReportDecision.isGranted()).isFalse();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. Controller & Tenant Isolation Tests
    // ─────────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Exact POST /api/account/reports/gst/summary?companyId=... succeeds with HTTP 200 and propagates companyId")
    void postGstSummaryWithCompanyIdParamSucceeds() throws Exception {
        GstSummaryDto mockResponse = new GstSummaryDto();
        mockResponse.setSummary(ReportSummaryDto.builder()
                .companyId(TARGET_COMPANY_ID)
                .companyName("Test Enterprise")
                .reportType("SUMMARY")
                .build());
        mockResponse.setTaxSummary(TaxSummaryDto.builder()
                .taxableAmount(BigDecimal.valueOf(500000))
                .totalTax(BigDecimal.valueOf(90000))
                .build());

        when(facade.getGstSummary(any(GstReportFilterDto.class))).thenReturn(mockResponse);

        // Security context with OWNER role
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "owner@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("OWNER");
        CurrentUserContext.setOrganizationId(ORG_ID);

        String requestUrl = "/api/account/reports/gst/summary?companyId=" + TARGET_COMPANY_ID;
        String jsonPayload = """
                {
                  "data": {
                    "financialYear": "FY2025-26"
                  }
                }
                """;

        mockMvc.perform(post(requestUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("GST summary retrieved successfully"))
                .andExpect(jsonPath("$.data.summary.companyName").value("Test Enterprise"))
                .andExpect(jsonPath("$.data.taxSummary.taxableAmount").value(500000));

        ArgumentCaptor<GstReportFilterDto> captor = ArgumentCaptor.forClass(GstReportFilterDto.class);
        verify(facade).getGstSummary(captor.capture());
        assertThat(captor.getValue().getCompanyId()).isEqualTo(TARGET_COMPANY_ID);
    }

    @Test
    @DisplayName("CurrentUserContext.resolveCompanyIdForQuery allows OWNER with explicit companyId")
    void ownerResolvesRequestedCompanyId() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "owner@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("OWNER");
        CurrentUserContext.setOrganizationId(ORG_ID);

        UUID resolved = CurrentUserContext.resolveCompanyIdForQuery(TARGET_COMPANY_ID);
        assertThat(resolved).isEqualTo(TARGET_COMPANY_ID);
    }

    @Test
    @DisplayName("CurrentUserContext.resolveCompanyIdForQuery rejects unauthorized company access for normal users")
    void regularUserAccessingUnauthorizedCompanyThrowsForbiddenException() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_ACCOUNTANT")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("ACCOUNTANT");
        CurrentUserContext.setCompanyId(TARGET_COMPANY_ID); // Assigned to TARGET_COMPANY_ID

        // Attempting to query OTHER_COMPANY_ID must throw ForbiddenException (403)
        assertThatThrownBy(() -> CurrentUserContext.resolveCompanyIdForQuery(OTHER_COMPANY_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access denied for the requested company resource");
    }

    @Test
    @DisplayName("CurrentUserContext.resolveCompanyIdForQuery returns assigned company for normal users with matching companyId")
    void regularUserWithMatchingCompanySucceeds() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_ACCOUNTANT")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("ACCOUNTANT");
        CurrentUserContext.setCompanyId(TARGET_COMPANY_ID);

        UUID resolved = CurrentUserContext.resolveCompanyIdForQuery(TARGET_COMPANY_ID);
        assertThat(resolved).isEqualTo(TARGET_COMPANY_ID);
    }
}
