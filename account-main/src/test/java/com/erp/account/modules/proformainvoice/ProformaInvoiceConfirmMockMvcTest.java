package com.erp.account.modules.proformainvoice;

import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.account.modules.proformainvoice.controller.ProformaInvoiceController;
import com.erp.account.modules.proformainvoice.dto.response.ProformaInvoiceResponse;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import com.erp.account.modules.proformainvoice.service.ProformaInvoiceService;
import com.erp.account.security.CustomAccessDeniedHandler;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.security.authorization.AuthenticatedUser;
import com.erp.account.security.authorization.SsoAuthorizationManager;
import com.erp.account.security.authorization.SsoAuthorizationProperties;
import jakarta.servlet.Filter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProformaInvoiceConfirmMockMvcTest {

    private final AtomicBoolean confirmCalled = new AtomicBoolean(false);
    private MockMvc mockMvc;
    private SsoAuthorizationManager ssoAuthorizationManager;
    private CustomAccessDeniedHandler customAccessDeniedHandler;

    private static final UUID PI_ID = UUID.fromString("3fa85f64-5717-4562-b3fc-2c963f66afa6");
    private static final UUID COMPANY_ID = UUID.fromString("ea811382-0afc-4908-a209-9bedcc63c445");

    @BeforeEach
    void setUp() {
        confirmCalled.set(false);
        SsoAuthorizationProperties properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "PROFORMA_INVOICES", List.of(
                        "/api/account/v1/proforma-invoices/**",
                        "/api/account/v2/proforma-invoices/**",
                        "/api/account/proforma-invoices/**"
                )
        ));
        ssoAuthorizationManager = new SsoAuthorizationManager(properties);
        customAccessDeniedHandler = new CustomAccessDeniedHandler();

        Filter securityFilter = (request, response, chain) -> {
            HttpServletRequest req = (HttpServletRequest) request;
            HttpServletResponse res = (HttpServletResponse) response;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            AuthorizationDecision decision = ssoAuthorizationManager.authorize(() -> auth, new RequestAuthorizationContext(req, null));
            if (decision == null || !decision.isGranted()) {
                customAccessDeniedHandler.handle(req, res, new AccessDeniedException("User does not have permission to access this resource"));
                return;
            }
            chain.doFilter(request, response);
        };

        ProformaInvoiceService proformaInvoiceService = (ProformaInvoiceService) Proxy.newProxyInstance(
                ProformaInvoiceService.class.getClassLoader(),
                new Class<?>[]{ProformaInvoiceService.class},
                (proxy, method, args) -> {
                    if ("confirmPI".equals(method.getName())) {
                        confirmCalled.set(true);
                        return ProformaInvoiceResponse.builder()
                                .id((UUID) args[1])
                                .piNumber("PI-2026-0001")
                                .status(ProformaInvoiceStatus.CONFIRMED)
                                .build();
                    }
                    return null;
                }
        );

        ProformaInvoiceController controller = new ProformaInvoiceController(proformaInvoiceService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .addFilters(securityFilter)
                .build();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
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

    private void authenticate(AuthenticatedUser user) {
        if (user == null) {
            SecurityContextHolder.clearContext();
            return;
        }
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user, null,
                user.getRoles().stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Authorized OWNER: POST /confirm?companyId=... returns HTTP 200 with success response")
    void testConfirmProformaInvoice_AuthorizedOwner_Returns200() throws Exception {
        CurrentUserContext.setAccessMode("FULL");

        // Authenticated user with exact /me profile:
        // - Account status: ACTIVE, Organization status: ACTIVE
        // - Membership type: OWNER, Membership status: ACTIVE, Assigned role: OWNER
        // - Subscription accessMode: FULL
        // - PROFORMA_INVOICES: READ, WRITE, DELETE allowed
        // - currentCompany is null
        AuthenticatedUser owner = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("owner@mark2erp.com")
                .companyCode(null) // currentCompany is null
                .roles(List.of("OWNER"))
                .accessMode("FULL")
                .activeFeatures(Set.of("PROFORMA_INVOICES", "WORKFLOW_DEFINITIONS", "WORKFLOW_TRANSACTIONS"))
                .permissions(List.of(
                        permission("PROFORMA_INVOICES", "READ", true, true),
                        permission("PROFORMA_INVOICES", "WRITE", true, true),
                        permission("PROFORMA_INVOICES", "DELETE", true, true)
                ))
                .build();

        authenticate(owner);

        mockMvc.perform(post("/api/account/v1/proforma-invoices/{id}/confirm", PI_ID)
                        .param("companyId", COMPANY_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Proforma Invoice confirmed successfully"))
                .andExpect(jsonPath("$.data.id").value(PI_ID.toString()))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        assertThat(confirmCalled.get()).isTrue();
    }

    @Test
    @DisplayName("Unauthorized user (only READ): POST /confirm?companyId=... returns HTTP 403 Forbidden with exact error payload")
    void testConfirmProformaInvoice_UnauthorizedUserWithOnlyRead_Returns403() throws Exception {
        CurrentUserContext.setAccessMode("FULL");

        AuthenticatedUser reader = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("reader@mark2erp.com")
                .companyCode(COMPANY_ID.toString())
                .roles(List.of("USER"))
                .accessMode("FULL")
                .activeFeatures(Set.of("PROFORMA_INVOICES"))
                .permissions(List.of(
                        permission("PROFORMA_INVOICES", "READ", true, true)
                ))
                .build();

        authenticate(reader);

        mockMvc.perform(post("/api/account/v1/proforma-invoices/{id}/confirm", PI_ID)
                        .param("companyId", COMPANY_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Forbidden"))
                .andExpect(jsonPath("$.error").value("User does not have permission to access this resource"));

        assertThat(confirmCalled.get()).isFalse();
    }

    @Test
    @DisplayName("Unauthorized user (unrelated permission): POST /confirm?companyId=... returns HTTP 403 Forbidden")
    void testConfirmProformaInvoice_UnrelatedPermission_Returns403() throws Exception {
        CurrentUserContext.setAccessMode("FULL");

        AuthenticatedUser otherUser = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("clerk@mark2erp.com")
                .companyCode(COMPANY_ID.toString())
                .roles(List.of("USER"))
                .accessMode("FULL")
                .activeFeatures(Set.of("CUSTOMERS"))
                .permissions(List.of(
                        permission("CUSTOMERS", "WRITE", true, true)
                ))
                .build();

        authenticate(otherUser);

        mockMvc.perform(post("/api/account/v1/proforma-invoices/{id}/confirm", PI_ID)
                        .param("companyId", COMPANY_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Forbidden"))
                .andExpect(jsonPath("$.error").value("User does not have permission to access this resource"));

        assertThat(confirmCalled.get()).isFalse();
    }

    @Test
    @DisplayName("Unauthenticated request: POST /confirm?companyId=... returns HTTP 403 Forbidden")
    void testConfirmProformaInvoice_Unauthenticated_Returns403() throws Exception {
        authenticate(null);

        mockMvc.perform(post("/api/account/v1/proforma-invoices/{id}/confirm", PI_ID)
                        .param("companyId", COMPANY_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Forbidden"))
                .andExpect(jsonPath("$.error").value("User does not have permission to access this resource"));

        assertThat(confirmCalled.get()).isFalse();
    }
}
