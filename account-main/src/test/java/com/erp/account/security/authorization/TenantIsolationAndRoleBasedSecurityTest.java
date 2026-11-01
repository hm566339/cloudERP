package com.erp.account.security.authorization;

import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Role-based access control and tenant isolation verification:
 * - Independent testing of OWNER, ADMIN, ACCOUNTANT, SALES_MANAGER, SALES_EXECUTIVE, WORKFLOW_APPROVER
 * - Cross-company isolation enforcement (Company A vs Company B)
 * - Separation of duties: workflow approvals do not accidentally grant accounting/ledger permissions
 */
class TenantIsolationAndRoleBasedSecurityTest {

    private SsoAuthorizationProperties properties;
    private SsoAuthorizationManager manager;

    private static final UUID COMPANY_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID COMPANY_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "QUOTATIONS", List.of("/api/account/sales/quotations/**", "/api/account/v1/quotations/**"),
                "PROFORMA_INVOICES", List.of("/api/account/v1/proforma-invoices/**", "/api/account/proforma-invoices/**"),
                "SALES_ORDERS", List.of("/api/account/v1/sales-orders/**", "/api/account/sales/orders/**"),
                "SALES_INVOICES", List.of("/api/account/sales/invoices/**", "/api/account/v1/sales-invoices/**"),
                "RECEIPTS", List.of("/api/account/receipt-vouchers/**", "/api/account/receipts/**"),
                "GENERAL_LEDGER", List.of("/api/account/gl/**"),
                "WORKFLOW_TRANSACTIONS", List.of("/api/account/workflow/**", "/api/v1/workflow/transactions/**")
        ));
        manager = new SsoAuthorizationManager(properties);
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    private PermissionResponse perm(String module, String action) {
        return PermissionResponse.builder()
                .permissionCode(module + ":" + action)
                .action(action)
                .moduleName(module)
                .featureCode(module)
                .active(true)
                .allowed(true)
                .build();
    }

    private AuthorizationDecision decide(AuthenticatedUser user, String method, String uri) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user, null,
                user.getRoles().stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList());
        SecurityContextHolder.getContext().setAuthentication(auth);
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        return manager.authorize(() -> auth, new RequestAuthorizationContext(request, null));
    }

    // =========================================================================
    // TASK 3: OWNER ROLE AND COMPANY CONTEXT RESOLUTION
    // =========================================================================

    @Test
    @DisplayName("OWNER with null currentCompany resolves explicit companyId from request")
    void ownerWithNullCurrentCompany_ResolvesExplicitCompanyId() {
        AuthenticatedUser owner = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("owner@mark2erp.com")
                .companyCode(null) // null in session
                .roles(List.of("OWNER"))
                .build();

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                owner, null, List.of(new SimpleGrantedAuthority("ROLE_OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("OWNER");

        // Explicit companyId provided in request query parameter
        UUID resolved = CurrentUserContext.resolveCompanyId(COMPANY_A);
        assertThat(resolved).isEqualTo(COMPANY_A);
    }

    @Test
    @DisplayName("OWNER with null currentCompany and null request companyId throws ValidationException")
    void ownerWithNullCurrentCompanyAndNullRequest_ThrowsValidationException() {
        AuthenticatedUser owner = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("owner@mark2erp.com")
                .companyCode(null)
                .roles(List.of("OWNER"))
                .build();

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                owner, null, List.of(new SimpleGrantedAuthority("ROLE_OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("OWNER");

        assertThatThrownBy(() -> CurrentUserContext.resolveCompanyId(null))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Company ID is required for organization owner operations");
    }

    // =========================================================================
    // MULTI-TENANT ISOLATION: COMPANY A vs COMPANY B
    // =========================================================================

    @Test
    @DisplayName("Company A user attempting to access Company B is blocked with ForbiddenException")
    void companyAUser_AccessingCompanyB_ThrowsForbiddenException() {
        CurrentUserContext.setCompanyId(COMPANY_A);
        CurrentUserContext.setUserId(UUID.randomUUID());

        // Same company -> OK
        assertThat(CurrentUserContext.resolveCompanyId(COMPANY_A)).isEqualTo(COMPANY_A);

        // Cross-company access -> Forbidden
        assertThatThrownBy(() -> CurrentUserContext.resolveCompanyId(COMPANY_B))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access denied for the requested company resource");
    }

    @Test
    @DisplayName("Normal user with uninitialized company context throws UnauthorizedException")
    void normalUserWithUninitializedContext_ThrowsUnauthorizedException() {
        CurrentUserContext.clearCompanyId();
        assertThatThrownBy(() -> CurrentUserContext.resolveCompanyId(COMPANY_A))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Company context not found in user session");
    }

    @Test
    @DisplayName("SYSTEM_ADMIN requires explicit companyId and can operate on any tenant")
    void systemAdmin_RequiresExplicitCompanyId_CanAccessAnyTenant() {
        AuthenticatedUser sysAdmin = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("sysadmin@platform.com")
                .roles(List.of("SYSTEM_ADMIN"))
                .build();

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                sysAdmin, null, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Specifying Company A -> allowed
        assertThat(CurrentUserContext.resolveCompanyId(COMPANY_A)).isEqualTo(COMPANY_A);
        // Specifying Company B -> allowed
        assertThat(CurrentUserContext.resolveCompanyId(COMPANY_B)).isEqualTo(COMPANY_B);
        // Missing company -> validation exception
        assertThatThrownBy(() -> CurrentUserContext.resolveCompanyId(null))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Company ID is required for system administrator operations");
    }

    // =========================================================================
    // TASK 5: ROLE-BASED ACCESS CONTROL (INDEPENDENT ROLE EVALUATION)
    // =========================================================================

    @Test
    @DisplayName("ADMIN role alone without permissions is DENIED (no universal bypass)")
    void adminRoleAlone_IsDenied() {
        AuthenticatedUser admin = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("admin@mark2erp.com")
                .roles(List.of("ADMIN"))
                .permissions(List.of()) // no permissions
                .build();

        assertThat(decide(admin, "GET", "/api/account/gl/accounts").isGranted()).isFalse();
        assertThat(decide(admin, "POST", "/api/account/sales/invoices/123/post").isGranted()).isFalse();
    }

    @Test
    @DisplayName("ACCOUNTANT role can post invoices and receipts, but cannot approve quotations or configure workflows")
    void accountantRolePermissions() {
        AuthenticatedUser accountant = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("accountant@mark2erp.com")
                .roles(List.of("ACCOUNTANT"))
                .activeFeatures(Set.of("SALES_INVOICES", "RECEIPTS", "GENERAL_LEDGER"))
                .permissions(List.of(
                        perm("SALES_INVOICES", "READ"),
                        perm("SALES_INVOICES", "WRITE"),
                        perm("RECEIPTS", "WRITE"),
                        perm("GENERAL_LEDGER", "READ")
                ))
                .build();

        // Permitted actions
        assertThat(decide(accountant, "POST", "/api/account/sales/invoices/123/post").isGranted()).isTrue();
        assertThat(decide(accountant, "POST", "/api/account/receipts/123/post").isGranted()).isTrue();
        assertThat(decide(accountant, "GET", "/api/account/gl/trial-balance").isGranted()).isTrue();

        // Forbidden actions (not in permissions)
        assertThat(decide(accountant, "POST", "/api/account/v1/quotations/123/approve").isGranted()).isFalse();
        assertThat(decide(accountant, "POST", "/api/account/v1/proforma-invoices/123/confirm").isGranted()).isFalse();
    }

    @Test
    @DisplayName("SALES_MANAGER can approve quotations and sales orders, but is DENIED GL posting")
    void salesManagerRolePermissions() {
        AuthenticatedUser salesManager = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("sales.mgr@mark2erp.com")
                .roles(List.of("SALES_MANAGER"))
                .activeFeatures(Set.of("QUOTATIONS", "SALES_ORDERS"))
                .permissions(List.of(
                        perm("QUOTATIONS", "READ"),
                        perm("QUOTATIONS", "APPROVE"),
                        perm("SALES_ORDERS", "READ"),
                        perm("SALES_ORDERS", "APPROVE")
                ))
                .build();

        // Permitted sales approvals
        assertThat(decide(salesManager, "POST", "/api/account/v1/quotations/123/approve").isGranted()).isTrue();
        assertThat(decide(salesManager, "POST", "/api/account/v1/sales-orders/123/approve").isGranted()).isTrue();

        // Denied accounting mutations (strict separation of duties)
        assertThat(decide(salesManager, "POST", "/api/account/sales/invoices/123/post").isGranted()).isFalse();
        assertThat(decide(salesManager, "POST", "/api/account/receipts/123/post").isGranted()).isFalse();
        assertThat(decide(salesManager, "GET", "/api/account/gl/trial-balance").isGranted()).isFalse();
    }

    @Test
    @DisplayName("SALES_EXECUTIVE can create quotations, but cannot approve them or confirm proforma invoices")
    void salesExecutiveRolePermissions() {
        AuthenticatedUser salesExec = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("sales.exec@mark2erp.com")
                .roles(List.of("SALES_EXECUTIVE"))
                .activeFeatures(Set.of("QUOTATIONS"))
                .permissions(List.of(
                        perm("QUOTATIONS", "READ"),
                        perm("QUOTATIONS", "WRITE")
                ))
                .build();

        // Can create/read quotations
        assertThat(decide(salesExec, "GET", "/api/account/v1/quotations/123").isGranted()).isTrue();
        assertThat(decide(salesExec, "POST", "/api/account/v1/quotations").isGranted()).isTrue();

        // Denied approval (cannot self-approve)
        assertThat(decide(salesExec, "POST", "/api/account/v1/quotations/123/approve").isGranted()).isFalse();
        // Denied other modules
        assertThat(decide(salesExec, "POST", "/api/account/v1/proforma-invoices/123/confirm").isGranted()).isFalse();
    }

    @Test
    @DisplayName("WORKFLOW_APPROVER permissions do NOT accidentally grant accounting or GL posting permissions")
    void workflowApproverPermissions_DoNotGrantAccountingAccess() {
        AuthenticatedUser approver = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("wf.approver@mark2erp.com")
                .roles(List.of("WORKFLOW_APPROVER"))
                .activeFeatures(Set.of("WORKFLOW_TRANSACTIONS"))
                .permissions(List.of(
                        perm("WORKFLOW_TRANSACTIONS", "READ"),
                        perm("WORKFLOW_TRANSACTIONS", "APPROVE")
                ))
                .build();

        // Can view workflow transactions
        assertThat(decide(approver, "GET", "/api/account/workflow/tasks").isGranted()).isTrue();

        // Cannot perform direct document mutations or accounting posts
        assertThat(decide(approver, "POST", "/api/account/sales/invoices/123/post").isGranted()).isFalse();
        assertThat(decide(approver, "POST", "/api/account/receipts/123/post").isGranted()).isFalse();
        assertThat(decide(approver, "GET", "/api/account/gl/trial-balance").isGranted()).isFalse();
        assertThat(decide(approver, "POST", "/api/account/v1/proforma-invoices/123/confirm").isGranted()).isFalse();
    }
}

