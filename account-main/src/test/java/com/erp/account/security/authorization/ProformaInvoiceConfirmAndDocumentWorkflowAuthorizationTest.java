package com.erp.account.security.authorization;

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
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verification of the exact failing POST /confirm endpoint and the complete
 * 6-document workflow action authorization matrix:
 * 1. Sales Quotations
 * 2. Proforma Invoices
 * 3. Sales Orders
 * 4. Delivery Challans
 * 5. Sales Invoices
 * 6. Receipt Vouchers
 */
class ProformaInvoiceConfirmAndDocumentWorkflowAuthorizationTest {

    private SsoAuthorizationProperties properties;
    private SsoAuthorizationManager manager;

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "QUOTATIONS", List.of("/api/account/sales/quotations/**", "/api/account/v1/quotations/**"),
                "PROFORMA_INVOICES", List.of("/api/account/v1/proforma-invoices/**", "/api/account/v2/proforma-invoices/**", "/api/account/proforma-invoices/**"),
                "SALES_ORDERS", List.of("/api/account/v1/sales-orders/**", "/api/account/v2/sales-orders/**", "/api/account/sales/orders/**"),
                "DELIVERY_CHALLANS", List.of("/api/account/v1/delivery-challans/**", "/api/account/sales/delivery-challans/**"),
                "SALES_INVOICES", List.of("/api/account/sales/invoices/**", "/api/account/v1/sales-invoices/**"),
                "RECEIPTS", List.of("/api/account/receipt-vouchers/**", "/api/account/receipts/**", "/api/account/v1/receipts/**"),
                "GENERAL_LEDGER", List.of("/api/account/gl/**")
        ));
        manager = new SsoAuthorizationManager(properties);
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
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
        if (user == null) {
            MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
            return manager.authorize(() -> null, new RequestAuthorizationContext(request, null));
        }
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user, null,
                user.getRoles().stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList());
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        return manager.authorize(() -> auth, new RequestAuthorizationContext(request, null));
    }

    // =========================================================================
    // TASK 1 & TASK 2: EXACT PRODUCTION FAILING ENDPOINT VERIFICATION
    // =========================================================================

    @Test
    @DisplayName("Exact production failing endpoint: OWNER with PROFORMA_INVOICES:WRITE is GRANTED confirm")
    void exactProductionRequest_OwnerWithWrite_isGranted() {
        String url = "/api/account/v1/proforma-invoices/3fa85f64-5717-4562-b3fc-2c963f66afa6/confirm?companyId=ea811382-0afc-4908-a209-9bedcc63c445";

        CurrentUserContext.setAccessMode("FULL");

        // Authenticated user matching the exact /me profile reported:
        // - Account status: ACTIVE
        // - Organization status: ACTIVE
        // - Membership type: OWNER
        // - Membership status: ACTIVE
        // - Assigned role: OWNER
        // - Subscription accessMode: FULL
        // - PROFORMA_INVOICES feature exists
        // - PROFORMA_INVOICES:READ = allowed
        // - PROFORMA_INVOICES:WRITE = allowed
        // - PROFORMA_INVOICES:DELETE = allowed
        // - WORKFLOW module is ACTIVE
        // - currentCompany is null
        AuthenticatedUser owner = AuthenticatedUser.builder()
                .userId(UUID.fromString("11111111-1111-1111-1111-111111111111"))
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

        AuthorizationDecision decision = decide(owner, "POST", url);
        assertThat(decision.isGranted())
                .as("OWNER with PROFORMA_INVOICES:WRITE must be granted confirm access via WRITE/UPDATE fallback")
                .isTrue();
    }

    @Test
    @DisplayName("Confirm endpoint is also granted when user explicitly holds PROFORMA_INVOICES:CONFIRM")
    void confirmEndpoint_WithExplicitConfirmPermission_isGranted() {
        String url = "/api/account/v1/proforma-invoices/3fa85f64-5717-4562-b3fc-2c963f66afa6/confirm?companyId=ea811382-0afc-4908-a209-9bedcc63c445";
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("clerk@mark2erp.com")
                .companyCode("ea811382-0afc-4908-a209-9bedcc63c445")
                .roles(List.of("USER"))
                .permissions(List.of(permission("PROFORMA_INVOICES", "CONFIRM", true, true)))
                .build();

        assertThat(decide(user, "POST", url).isGranted()).isTrue();
    }

    @Test
    @DisplayName("Confirm endpoint is also granted when user holds PROFORMA_INVOICES:UPDATE or APPROVE")
    void confirmEndpoint_WithUpdateOrApprovePermission_isGranted() {
        String url = "/api/account/v1/proforma-invoices/3fa85f64-5717-4562-b3fc-2c963f66afa6/confirm?companyId=ea811382-0afc-4908-a209-9bedcc63c445";

        AuthenticatedUser userWithUpdate = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("updater@mark2erp.com")
                .roles(List.of("USER"))
                .permissions(List.of(permission("PROFORMA_INVOICES", "UPDATE", true, true)))
                .build();
        assertThat(decide(userWithUpdate, "POST", url).isGranted()).isTrue();

        AuthenticatedUser userWithApprove = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("approver@mark2erp.com")
                .roles(List.of("USER"))
                .permissions(List.of(permission("PROFORMA_INVOICES", "APPROVE", true, true)))
                .build();
        assertThat(decide(userWithApprove, "POST", url).isGranted()).isTrue();
    }

    @Test
    @DisplayName("Confirm endpoint is DENIED when user has only PROFORMA_INVOICES:READ")
    void confirmEndpoint_WithOnlyReadPermission_isDenied() {
        String url = "/api/account/v1/proforma-invoices/3fa85f64-5717-4562-b3fc-2c963f66afa6/confirm?companyId=ea811382-0afc-4908-a209-9bedcc63c445";
        AuthenticatedUser reader = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("viewer@mark2erp.com")
                .roles(List.of("USER"))
                .permissions(List.of(permission("PROFORMA_INVOICES", "READ", true, true)))
                .build();

        assertThat(decide(reader, "POST", url).isGranted()).isFalse();
    }

    @Test
    @DisplayName("Confirm endpoint is DENIED when permission is inactive or allowed=false")
    void confirmEndpoint_WithInactiveOrDisallowedPermission_isDenied() {
        String url = "/api/account/v1/proforma-invoices/3fa85f64-5717-4562-b3fc-2c963f66afa6/confirm?companyId=ea811382-0afc-4908-a209-9bedcc63c445";

        AuthenticatedUser inactive = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("inactive@mark2erp.com")
                .roles(List.of("USER"))
                .permissions(List.of(permission("PROFORMA_INVOICES", "WRITE", false, true)))
                .build();
        assertThat(decide(inactive, "POST", url).isGranted()).isFalse();

        AuthenticatedUser disallowed = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("disallowed@mark2erp.com")
                .roles(List.of("USER"))
                .permissions(List.of(permission("PROFORMA_INVOICES", "WRITE", true, false)))
                .build();
        assertThat(decide(disallowed, "POST", url).isGranted()).isFalse();
    }

    @Test
    @DisplayName("Confirm endpoint is DENIED for unauthenticated caller")
    void confirmEndpoint_Unauthenticated_isDenied() {
        String url = "/api/account/v1/proforma-invoices/3fa85f64-5717-4562-b3fc-2c963f66afa6/confirm?companyId=ea811382-0afc-4908-a209-9bedcc63c445";
        assertThat(decide(null, "POST", url).isGranted()).isFalse();
    }

    // =========================================================================
    // TASK 4: AUDIT ALL 6 WORKFLOW DOCUMENT ACTIONS
    // =========================================================================

    // ── 1. Sales Quotations ──────────────────────────────────────────────────

    @Test
    @DisplayName("Document 1: Sales Quotations actions audit")
    void salesQuotationsActionsAudit() {
        String base = "/api/account/v1/quotations";
        String id = "58994921-5f9e-47d7-a0bc-261d05472b4e";

        AuthenticatedUser readUser = userWith("QUOTATIONS", "READ");
        AuthenticatedUser writeUser = userWith("QUOTATIONS", "WRITE");
        AuthenticatedUser approveUser = userWith("QUOTATIONS", "APPROVE");
        AuthenticatedUser rejectUser = userWith("QUOTATIONS", "REJECT");
        AuthenticatedUser cancelUser = userWith("QUOTATIONS", "CANCEL");

        // READ
        assertThat(decide(readUser, "GET", base + "/" + id).isGranted()).isTrue();
        assertThat(decide(readUser, "GET", base).isGranted()).isTrue();

        // CREATE & UPDATE
        assertThat(decide(readUser, "POST", base).isGranted()).isFalse();
        assertThat(decide(writeUser, "POST", base).isGranted()).isTrue();
        assertThat(decide(writeUser, "PUT", base + "/" + id).isGranted()).isTrue();

        // DELETE
        AuthenticatedUser deleteUser = userWith("QUOTATIONS", "DELETE");
        assertThat(decide(writeUser, "DELETE", base + "/" + id).isGranted()).isFalse();
        assertThat(decide(deleteUser, "DELETE", base + "/" + id).isGranted()).isTrue();

        // SUBMIT (/submit-approval)
        assertThat(decide(writeUser, "POST", base + "/" + id + "/submit-approval").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/submit-approval").isGranted()).isFalse();

        // SEND (/send)
        assertThat(decide(writeUser, "POST", base + "/" + id + "/send").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/send").isGranted()).isFalse();

        // APPROVE (/approve)
        assertThat(decide(approveUser, "POST", base + "/" + id + "/approve").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/approve").isGranted()).isFalse();

        // REJECT (/reject)
        assertThat(decide(rejectUser, "POST", base + "/" + id + "/reject").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/reject").isGranted()).isFalse();

        // CANCEL (/cancel)
        assertThat(decide(cancelUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue(); // WRITE satisfies CANCEL
        assertThat(decide(readUser, "POST", base + "/" + id + "/cancel").isGranted()).isFalse();
    }

    // ── 2. Proforma Invoices ─────────────────────────────────────────────────

    @Test
    @DisplayName("Document 2: Proforma Invoices actions audit")
    void proformaInvoicesActionsAudit() {
        String base = "/api/account/v1/proforma-invoices";
        String id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

        AuthenticatedUser readUser = userWith("PROFORMA_INVOICES", "READ");
        AuthenticatedUser writeUser = userWith("PROFORMA_INVOICES", "WRITE");
        AuthenticatedUser approveUser = userWith("PROFORMA_INVOICES", "APPROVE");
        AuthenticatedUser rejectUser = userWith("PROFORMA_INVOICES", "REJECT");
        AuthenticatedUser cancelUser = userWith("PROFORMA_INVOICES", "CANCEL");

        // READ
        assertThat(decide(readUser, "GET", base + "/" + id).isGranted()).isTrue();

        // CREATE & UPDATE
        assertThat(decide(writeUser, "POST", base).isGranted()).isTrue();
        assertThat(decide(writeUser, "PUT", base + "/" + id).isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base).isGranted()).isFalse();

        // DELETE
        AuthenticatedUser deleteUser = userWith("PROFORMA_INVOICES", "DELETE");
        assertThat(decide(writeUser, "DELETE", base + "/" + id).isGranted()).isFalse();
        assertThat(decide(deleteUser, "DELETE", base + "/" + id).isGranted()).isTrue();

        // SUBMIT
        assertThat(decide(writeUser, "POST", base + "/" + id + "/submit").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/submit").isGranted()).isFalse();

        // CONFIRM
        assertThat(decide(writeUser, "POST", base + "/" + id + "/confirm").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/confirm").isGranted()).isFalse();

        // APPROVE
        assertThat(decide(approveUser, "POST", base + "/" + id + "/approve").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/approve").isGranted()).isFalse();

        // REJECT
        assertThat(decide(rejectUser, "POST", base + "/" + id + "/reject").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/reject").isGranted()).isFalse();

        // CONVERT
        assertThat(decide(writeUser, "POST", base + "/" + id + "/convert-to-invoice").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/convert-to-invoice").isGranted()).isFalse();

        // CANCEL
        assertThat(decide(cancelUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/cancel").isGranted()).isFalse();
    }

    // ── 3. Sales Orders ──────────────────────────────────────────────────────

    @Test
    @DisplayName("Document 3: Sales Orders actions audit")
    void salesOrdersActionsAudit() {
        String base = "/api/account/v1/sales-orders";
        String id = "22222222-2222-2222-2222-222222222222";

        AuthenticatedUser readUser = userWith("SALES_ORDERS", "READ");
        AuthenticatedUser writeUser = userWith("SALES_ORDERS", "WRITE");
        AuthenticatedUser approveUser = userWith("SALES_ORDERS", "APPROVE");
        AuthenticatedUser cancelUser = userWith("SALES_ORDERS", "CANCEL");

        // READ
        assertThat(decide(readUser, "GET", base + "/" + id).isGranted()).isTrue();

        // CREATE & UPDATE
        assertThat(decide(writeUser, "POST", base + "/from-quotation/123").isGranted()).isTrue();
        assertThat(decide(writeUser, "PUT", base + "/" + id).isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/from-quotation/123").isGranted()).isFalse();

        // SUBMIT
        assertThat(decide(writeUser, "POST", base + "/" + id + "/submit").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/submit").isGranted()).isFalse();

        // CONFIRM
        assertThat(decide(writeUser, "POST", base + "/" + id + "/confirm").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/confirm").isGranted()).isFalse();

        // APPROVE
        assertThat(decide(approveUser, "POST", base + "/" + id + "/approve").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/approve").isGranted()).isFalse();

        // CANCEL
        assertThat(decide(cancelUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();

        // Alternative mapping: /api/account/sales/orders
        assertThat(decide(writeUser, "POST", "/api/account/sales/orders/" + id + "/confirm").isGranted()).isTrue();
    }

    // ── 4. Delivery Challans ─────────────────────────────────────────────────

    @Test
    @DisplayName("Document 4: Delivery Challans actions audit")
    void deliveryChallansActionsAudit() {
        String base = "/api/account/v1/delivery-challans";
        String id = "33333333-3333-3333-3333-333333333333";

        AuthenticatedUser readUser = userWith("DELIVERY_CHALLANS", "READ");
        AuthenticatedUser writeUser = userWith("DELIVERY_CHALLANS", "WRITE");
        AuthenticatedUser approveUser = userWith("DELIVERY_CHALLANS", "APPROVE");
        AuthenticatedUser cancelUser = userWith("DELIVERY_CHALLANS", "CANCEL");

        // READ
        assertThat(decide(readUser, "GET", base + "/" + id).isGranted()).isTrue();

        // CREATE & UPDATE
        assertThat(decide(writeUser, "POST", base + "/from-sales-order").isGranted()).isTrue();
        assertThat(decide(writeUser, "PUT", base + "/" + id).isGranted()).isTrue();

        // SUBMIT
        assertThat(decide(writeUser, "POST", base + "/" + id + "/submit").isGranted()).isTrue();

        // CONFIRM
        assertThat(decide(writeUser, "POST", base + "/" + id + "/confirm").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/confirm").isGranted()).isFalse();

        // APPROVE
        assertThat(decide(approveUser, "POST", base + "/" + id + "/approve").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/approve").isGranted()).isFalse();

        // CANCEL
        assertThat(decide(cancelUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();

        // Alternative mapping: /api/account/sales/delivery-challans
        assertThat(decide(writeUser, "POST", "/api/account/sales/delivery-challans/" + id + "/confirm").isGranted()).isTrue();
    }

    // ── 5. Sales Invoices ────────────────────────────────────────────────────

    @Test
    @DisplayName("Document 5: Sales Invoices actions audit")
    void salesInvoicesActionsAudit() {
        String base = "/api/account/sales/invoices";
        String id = "44444444-4444-4444-4444-444444444444";

        AuthenticatedUser readUser = userWith("SALES_INVOICES", "READ");
        AuthenticatedUser writeUser = userWith("SALES_INVOICES", "WRITE");
        AuthenticatedUser approveUser = userWith("SALES_INVOICES", "APPROVE");
        AuthenticatedUser rejectUser = userWith("SALES_INVOICES", "REJECT");
        AuthenticatedUser cancelUser = userWith("SALES_INVOICES", "CANCEL");

        // READ
        assertThat(decide(readUser, "GET", base + "/" + id).isGranted()).isTrue();

        // CREATE & UPDATE
        assertThat(decide(writeUser, "POST", base).isGranted()).isTrue();
        assertThat(decide(writeUser, "PUT", base + "/" + id).isGranted()).isTrue();

        // DELETE
        AuthenticatedUser deleteUser = userWith("SALES_INVOICES", "DELETE");
        assertThat(decide(writeUser, "DELETE", base + "/" + id).isGranted()).isFalse();
        assertThat(decide(deleteUser, "DELETE", base + "/" + id).isGranted()).isTrue();

        // SUBMIT
        assertThat(decide(writeUser, "POST", base + "/" + id + "/submit").isGranted()).isTrue();

        // APPROVE & REJECT
        assertThat(decide(approveUser, "POST", base + "/" + id + "/approve").isGranted()).isTrue();
        assertThat(decide(rejectUser, "POST", base + "/" + id + "/reject").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/approve").isGranted()).isFalse();

        // POST (GL posting requires POST / WRITE / UPDATE)
        assertThat(decide(writeUser, "POST", base + "/" + id + "/post").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/post").isGranted()).isFalse();

        // CANCEL
        assertThat(decide(cancelUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();

        // Versioned alias: /api/account/v1/sales-invoices/**
        assertThat(decide(writeUser, "POST", "/api/account/v1/sales-invoices/" + id + "/post").isGranted()).isTrue();
    }

    // ── 6. Receipt Vouchers ──────────────────────────────────────────────────

    @Test
    @DisplayName("Document 6: Receipt Vouchers actions audit")
    void receiptVouchersActionsAudit() {
        String base = "/api/account/receipts";
        String id = "55555555-5555-5555-5555-555555555555";

        AuthenticatedUser readUser = userWith("RECEIPTS", "READ");
        AuthenticatedUser writeUser = userWith("RECEIPTS", "WRITE");
        AuthenticatedUser approveUser = userWith("RECEIPTS", "APPROVE");
        AuthenticatedUser rejectUser = userWith("RECEIPTS", "REJECT");
        AuthenticatedUser cancelUser = userWith("RECEIPTS", "CANCEL");

        // READ
        assertThat(decide(readUser, "GET", base + "/" + id).isGranted()).isTrue();

        // CREATE & UPDATE
        assertThat(decide(writeUser, "POST", base).isGranted()).isTrue();
        assertThat(decide(writeUser, "PUT", base + "/" + id).isGranted()).isTrue();

        // DELETE
        AuthenticatedUser deleteUser = userWith("RECEIPTS", "DELETE");
        assertThat(decide(writeUser, "DELETE", base + "/" + id).isGranted()).isFalse();
        assertThat(decide(deleteUser, "DELETE", base + "/" + id).isGranted()).isTrue();

        // SUBMIT
        assertThat(decide(writeUser, "POST", base + "/" + id + "/submit").isGranted()).isTrue();

        // APPROVE & REJECT
        assertThat(decide(approveUser, "POST", base + "/" + id + "/approve").isGranted()).isTrue();
        assertThat(decide(rejectUser, "POST", base + "/" + id + "/reject").isGranted()).isTrue();

        // POST (GL posting)
        assertThat(decide(writeUser, "POST", base + "/" + id + "/post").isGranted()).isTrue();
        assertThat(decide(readUser, "POST", base + "/" + id + "/post").isGranted()).isFalse();

        // REVERSE
        assertThat(decide(writeUser, "POST", base + "/" + id + "/reverse").isGranted()).isTrue();

        // CANCEL
        assertThat(decide(cancelUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();
        assertThat(decide(writeUser, "POST", base + "/" + id + "/cancel").isGranted()).isTrue();

        // Versioned alias: /api/account/v1/receipts/**
        assertThat(decide(writeUser, "POST", "/api/account/v1/receipts/" + id + "/post").isGranted()).isTrue();
    }

    private AuthenticatedUser userWith(String module, String action) {
        return AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("test.user")
                .companyCode("ea811382-0afc-4908-a209-9bedcc63c445")
                .roles(List.of("USER"))
                .activeFeatures(Set.of(module))
                .permissions(List.of(permission(module, action, true, true)))
                .build();
    }
}

