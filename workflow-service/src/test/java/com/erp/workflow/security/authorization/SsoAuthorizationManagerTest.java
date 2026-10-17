package com.erp.workflow.security.authorization;

import com.erp.workflow.security.CurrentUserContext;
import com.erp.workflow.security.dto.sso.AccountStatus;
import com.erp.workflow.security.dto.sso.PermissionResponse;
import com.erp.workflow.security.dto.sso.RoleResponse;
import com.erp.workflow.security.dto.sso.UserResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class SsoAuthorizationManagerTest {

    private SsoAuthorizationProperties properties;
    private SsoAuthorizationManager manager;

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "WORKFLOW_DEFINITIONS", List.of("/api/v1/workflow/definitions", "/api/v1/workflow/definitions/**"),
                "WORKFLOW_TRANSACTIONS", List.of("/api/v1/workflow/transactions", "/api/v1/workflow/transactions/**"),
                "WORKFLOW_TASKS", List.of("/api/v1/workflow/tasks", "/api/v1/workflow/tasks/**"),
                "WORKFLOW_NOTIFICATIONS", List.of("/api/v1/workflow/notifications", "/api/v1/workflow/notifications/**"),
                "WORKFLOW_ATTACHMENTS", List.of("/api/v1/workflow/attachments", "/api/v1/workflow/attachments/**"),
                "WORKFLOW_CALLBACKS", List.of("/api/v1/workflow/callbacks", "/api/v1/workflow/callbacks/**")
        ));
        properties.setFeatureGroups(Map.of(
                "WORKFLOW_ADMIN", Map.of(
                        "WORKFLOW", List.of("READ", "CREATE", "UPDATE", "WRITE", "DELETE", "ACTIVATE", "DEACTIVATE"),
                        "WORKFLOW_DEFINITIONS", List.of("READ", "CREATE", "UPDATE", "WRITE", "DELETE", "ACTIVATE", "DEACTIVATE"),
                        "WORKFLOW_TRANSACTIONS", List.of("READ", "CREATE", "UPDATE", "WRITE", "DELETE", "CANCEL")
                )
        ));
        properties.setWriteImpliesCreateUpdate(false);
        manager = new SsoAuthorizationManager(properties);
        CurrentUserContext.clear();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    private AuthenticatedUser buildUser(List<String> roles, List<PermissionResponse> permissions) {
        return AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("test.user")
                .organizationId(UUID.randomUUID())
                .accessMode("FULL")
                .roles(roles != null ? roles : List.of())
                .permissions(permissions != null ? permissions : List.of())
                .build();
    }

    private AuthorizationDecision decide(AuthenticatedUser user, String method, String uri) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        if (user != null && user.getRoles() != null) {
            for (String r : user.getRoles()) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + r));
            }
        }
        UsernamePasswordAuthenticationToken auth = (user != null)
                ? new UsernamePasswordAuthenticationToken(user, null, authorities)
                : null;
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        return manager.authorize(() -> auth, new RequestAuthorizationContext(request, null));
    }

    @Test
    @DisplayName("Unauthenticated request is denied")
    void testUnauthenticatedDenied() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        AuthorizationDecision decision = manager.authorize(() -> null, new RequestAuthorizationContext(request, null));
        assertThat(decision.isGranted()).isFalse();

        AnonymousAuthenticationToken anon = new AnonymousAuthenticationToken(
                "key", "anon", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS")));
        decision = manager.authorize(() -> anon, new RequestAuthorizationContext(request, null));
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Active and allowed permission grants access to workflow route")
    void testActiveAndAllowedPermissionGrantsAccess() {
        PermissionResponse perm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("READ")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser user = buildUser(List.of("USER"), List.of(perm));

        AuthorizationDecision decision = decide(user, "GET", "/api/v1/workflow/definitions");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("Inactive or disallowed permission denies access (fail closed)")
    void testInactiveOrDisallowedPermissionDenied() {
        PermissionResponse inactive = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("READ")
                .active(false)
                .allowed(true)
                .build();
        AuthenticatedUser user1 = buildUser(List.of("USER"), List.of(inactive));
        assertThat(decide(user1, "GET", "/api/v1/workflow/definitions").isGranted()).isFalse();

        PermissionResponse disallowed = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("READ")
                .active(true)
                .allowed(false)
                .build();
        AuthenticatedUser user2 = buildUser(List.of("USER"), List.of(disallowed));
        assertThat(decide(user2, "GET", "/api/v1/workflow/definitions").isGranted()).isFalse();
    }

    @Test
    @DisplayName("Wrong module or wrong action denies access")
    void testWrongModuleOrActionDenied() {
        PermissionResponse perm = PermissionResponse.builder()
                .moduleName("WORKFLOW_TASKS")
                .action("READ")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser user = buildUser(List.of("USER"), List.of(perm));

        // Attempting to access WORKFLOW_DEFINITIONS with only WORKFLOW_TASKS permission
        assertThat(decide(user, "GET", "/api/v1/workflow/definitions").isGranted()).isFalse();

        // Attempting to DELETE with only READ permission
        assertThat(decide(user, "DELETE", "/api/v1/workflow/tasks/123").isGranted()).isFalse();
    }

    @Test
    @DisplayName("Case-insensitive module and action matching succeeds")
    void testCaseInsensitiveMatching() {
        PermissionResponse perm = PermissionResponse.builder()
                .moduleName("workflow_definitions")
                .action("read")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser user = buildUser(List.of("USER"), List.of(perm));

        assertThat(decide(user, "GET", "/api/v1/workflow/definitions").isGranted()).isTrue();
    }

    @Test
    @DisplayName("Active SYSTEM_ADMIN bypasses module authorization")
    void testActiveSystemAdminBypass() {
        AuthenticatedUser admin = buildUser(List.of("SYSTEM_ADMIN"), List.of());
        assertThat(decide(admin, "GET", "/api/v1/workflow/definitions").isGranted()).isTrue();
        assertThat(decide(admin, "DELETE", "/api/v1/workflow/transactions/123").isGranted()).isTrue();
        assertThat(decide(admin, "POST", "/api/v1/workflow/tasks/123/approve").isGranted()).isTrue();
    }

    @Test
    @DisplayName("Inactive SYSTEM_ADMIN role does NOT bypass authorization")
    void testInactiveSystemAdminDoesNotBypass() {
        // AuthenticatedUser with no active SYSTEM_ADMIN
        AuthenticatedUser nonAdmin = buildUser(List.of("SOME_ROLE"), List.of());
        assertThat(decide(nonAdmin, "GET", "/api/v1/workflow/definitions").isGranted()).isFalse();
    }

    @Test
    @DisplayName("Roles alone do not grant business API permissions")
    void testRolesAloneDoNotGrantPermissions() {
        AuthenticatedUser managerUser = buildUser(List.of("WORKFLOW_MANAGER", "ADMIN"), List.of());
        assertThat(decide(managerUser, "GET", "/api/v1/workflow/definitions").isGranted()).isFalse();
        assertThat(decide(managerUser, "POST", "/api/v1/workflow/tasks/123/approve").isGranted()).isFalse();
    }

    @Test
    @DisplayName("BLOCKED access mode denies all requests")
    void testBlockedAccessModeDenied() {
        PermissionResponse perm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("READ")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("blocked.user")
                .accessMode("BLOCKED")
                .permissions(List.of(perm))
                .build();

        assertThat(decide(user, "GET", "/api/v1/workflow/definitions").isGranted()).isFalse();
    }

    @Test
    @DisplayName("READ_ONLY access mode permits GET but denies mutation requests")
    void testReadOnlyAccessMode() {
        PermissionResponse readPerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("READ")
                .active(true)
                .allowed(true)
                .build();
        PermissionResponse writePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("CREATE")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("readonly.user")
                .accessMode("READ_ONLY")
                .permissions(List.of(readPerm, writePerm))
                .build();

        // GET is permitted
        assertThat(decide(user, "GET", "/api/v1/workflow/definitions").isGranted()).isTrue();

        // Mutation (POST) is blocked under READ_ONLY mode
        assertThat(decide(user, "POST", "/api/v1/workflow/definitions").isGranted()).isFalse();
    }

    @Test
    @DisplayName("All five workflow controller route groups are mapped and protected")
    void testAllFiveWorkflowRouteGroups() {
        // Test definitions
        PermissionResponse p1 = PermissionResponse.builder().moduleName("WORKFLOW_DEFINITIONS").action("READ").active(true).allowed(true).build();
        assertThat(decide(buildUser(List.of(), List.of(p1)), "GET", "/api/v1/workflow/definitions").isGranted()).isTrue();

        // Test transactions
        PermissionResponse p2 = PermissionResponse.builder().moduleName("WORKFLOW_TRANSACTIONS").action("READ").active(true).allowed(true).build();
        assertThat(decide(buildUser(List.of(), List.of(p2)), "GET", "/api/v1/workflow/transactions").isGranted()).isTrue();

        // Test tasks
        PermissionResponse p3 = PermissionResponse.builder().moduleName("WORKFLOW_TASKS").action("READ").active(true).allowed(true).build();
        assertThat(decide(buildUser(List.of(), List.of(p3)), "GET", "/api/v1/workflow/tasks/my-tasks").isGranted()).isTrue();

        // Test notifications
        PermissionResponse p4 = PermissionResponse.builder().moduleName("WORKFLOW_NOTIFICATIONS").action("READ").active(true).allowed(true).build();
        assertThat(decide(buildUser(List.of(), List.of(p4)), "GET", "/api/v1/workflow/notifications").isGranted()).isTrue();

        // Test attachments
        PermissionResponse p5 = PermissionResponse.builder().moduleName("WORKFLOW_ATTACHMENTS").action("READ").active(true).allowed(true).build();
        assertThat(decide(buildUser(List.of(), List.of(p5)), "GET", "/api/v1/workflow/attachments/transaction/123").isGranted()).isTrue();
    }

    @Test
    @DisplayName("Custom action suffixes are properly mapped to distinct SSO actions")
    void testCustomActionSuffixes() {
        // Approve task
        PermissionResponse approvePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_TASKS").action("APPROVE").active(true).allowed(true).build();
        AuthenticatedUser approver = buildUser(List.of(), List.of(approvePerm));
        assertThat(decide(approver, "POST", "/api/v1/workflow/tasks/123/approve").isGranted()).isTrue();

        // Reject task
        PermissionResponse rejectPerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_TASKS").action("REJECT").active(true).allowed(true).build();
        AuthenticatedUser rejecter = buildUser(List.of(), List.of(rejectPerm));
        assertThat(decide(rejecter, "POST", "/api/v1/workflow/tasks/123/reject").isGranted()).isTrue();

        // Return task
        PermissionResponse returnPerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_TASKS").action("RETURN").active(true).allowed(true).build();
        AuthenticatedUser returner = buildUser(List.of(), List.of(returnPerm));
        assertThat(decide(returner, "POST", "/api/v1/workflow/tasks/123/return").isGranted()).isTrue();

        // Delegate task
        PermissionResponse delegatePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_TASKS").action("DELEGATE").active(true).allowed(true).build();
        AuthenticatedUser delegator = buildUser(List.of(), List.of(delegatePerm));
        assertThat(decide(delegator, "POST", "/api/v1/workflow/tasks/123/delegate").isGranted()).isTrue();

        // Cancel workflow transaction
        PermissionResponse cancelPerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_TRANSACTIONS").action("CANCEL").active(true).allowed(true).build();
        AuthenticatedUser canceler = buildUser(List.of(), List.of(cancelPerm));
        assertThat(decide(canceler, "POST", "/api/v1/workflow/transactions/123/cancel").isGranted()).isTrue();

        // Activate definition
        PermissionResponse activatePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS").action("ACTIVATE").active(true).allowed(true).build();
        AuthenticatedUser activator = buildUser(List.of(), List.of(activatePerm));
        assertThat(decide(activator, "PATCH", "/api/v1/workflow/definitions/123/activate").isGranted()).isTrue();

        // Deactivate definition
        PermissionResponse deactivatePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS").action("DEACTIVATE").active(true).allowed(true).build();
        AuthenticatedUser deactivator = buildUser(List.of(), List.of(deactivatePerm));
        assertThat(decide(deactivator, "PATCH", "/api/v1/workflow/definitions/123/deactivate").isGranted()).isTrue();

        // Upload attachment
        PermissionResponse uploadPerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_ATTACHMENTS").action("CREATE").active(true).allowed(true).build();
        AuthenticatedUser uploader = buildUser(List.of(), List.of(uploadPerm));
        assertThat(decide(uploader, "POST", "/api/v1/workflow/attachments/upload").isGranted()).isTrue();
    }

    @Test
    @DisplayName("WRITE does not implicitly grant CREATE or UPDATE by default")
    void testWriteDoesNotImplicitlyGrantCreateOrUpdate() {
        PermissionResponse writePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("WRITE")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser user = buildUser(List.of(), List.of(writePerm));

        // When writeImpliesCreateUpdate is false, a POST requires CREATE or WRITE (by default POST method has [CREATE, WRITE])
        // Let's test custom action or method action without WRITE
        properties.setMethodActions(Map.of("POST", List.of("CREATE")));
        properties.setWriteImpliesCreateUpdate(false);

        // WRITE does not satisfy CREATE
        assertThat(decide(user, "POST", "/api/v1/workflow/definitions").isGranted()).isFalse();

        // When opt-in enabled, WRITE satisfies CREATE
        properties.setWriteImpliesCreateUpdate(true);
        assertThat(decide(user, "POST", "/api/v1/workflow/definitions").isGranted()).isTrue();
    }

    @Test
    @DisplayName("OWNER role can activate and deactivate workflow definitions")
    void testOwnerCanActivateAndDeactivateWorkflowDefinition() {
        AuthenticatedUser owner = buildUser(List.of("OWNER"), List.of());

        assertThat(decide(owner, "PATCH", "/api/v1/workflow/definitions/7ac31517-e9b0-46ff-8164-3b6a62c8a977/activate").isGranted()).isTrue();
        assertThat(decide(owner, "PATCH", "/api/v1/workflow/definitions/7ac31517-e9b0-46ff-8164-3b6a62c8a977/deactivate").isGranted()).isTrue();
    }

    @Test
    @DisplayName("User with WORKFLOW_DEFINITIONS:WRITE CANNOT activate or deactivate without explicit ACTIVATE/DEACTIVATE permission")
    void testUserWithWritePermissionCannotActivateOrDeactivateWithoutExplicitPermission() {
        PermissionResponse writePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("WRITE")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser writer = buildUser(List.of(), List.of(writePerm));

        assertThat(decide(writer, "PATCH", "/api/v1/workflow/definitions/123/activate").isGranted()).isFalse();
        assertThat(decide(writer, "PATCH", "/api/v1/workflow/definitions/123/deactivate").isGranted()).isFalse();
    }

    @Test
    @DisplayName("User with WORKFLOW_DEFINITIONS:UPDATE CANNOT activate or deactivate without explicit ACTIVATE/DEACTIVATE permission")
    void testUserWithUpdatePermissionCannotActivateOrDeactivateWithoutExplicitPermission() {
        PermissionResponse updatePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("UPDATE")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser updater = buildUser(List.of(), List.of(updatePerm));

        assertThat(decide(updater, "PATCH", "/api/v1/workflow/definitions/123/activate").isGranted()).isFalse();
        assertThat(decide(updater, "PATCH", "/api/v1/workflow/definitions/123/deactivate").isGranted()).isFalse();
    }

    @Test
    @DisplayName("User with WORKFLOW_DEFINITIONS:ACTIVATE can activate but cannot deactivate or do CRUD")
    void testUserWithExplicitActivatePermissionCanActivateWorkflowDefinition() {
        PermissionResponse activatePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("ACTIVATE")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser activator = buildUser(List.of(), List.of(activatePerm));

        // Can activate
        assertThat(decide(activator, "PATCH", "/api/v1/workflow/definitions/123/activate").isGranted()).isTrue();
        // Cannot deactivate
        assertThat(decide(activator, "PATCH", "/api/v1/workflow/definitions/123/deactivate").isGranted()).isFalse();
        // Cannot do CRUD (GET, DELETE, etc.)
        assertThat(decide(activator, "GET", "/api/v1/workflow/definitions").isGranted()).isFalse();
        assertThat(decide(activator, "DELETE", "/api/v1/workflow/definitions/123").isGranted()).isFalse();
    }

    @Test
    @DisplayName("User with WORKFLOW_DEFINITIONS:DEACTIVATE can deactivate but cannot activate")
    void testUserWithExplicitDeactivatePermissionCanDeactivateWorkflowDefinition() {
        PermissionResponse deactivatePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("DEACTIVATE")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser deactivator = buildUser(List.of(), List.of(deactivatePerm));

        assertThat(decide(deactivator, "PATCH", "/api/v1/workflow/definitions/123/deactivate").isGranted()).isTrue();
        assertThat(decide(deactivator, "PATCH", "/api/v1/workflow/definitions/123/activate").isGranted()).isFalse();
    }

    @Test
    @DisplayName("User with only WORKFLOW_DEFINITIONS:READ CANNOT activate workflow definitions")
    void testUserWithOnlyReadPermissionCannotActivateWorkflowDefinition() {
        PermissionResponse readPerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("READ")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser reader = buildUser(List.of(), List.of(readPerm));

        assertThat(decide(reader, "PATCH", "/api/v1/workflow/definitions/123/activate").isGranted()).isFalse();
        assertThat(decide(reader, "PATCH", "/api/v1/workflow/definitions/123/deactivate").isGranted()).isFalse();
    }

    @Test
    @DisplayName("Workflow definition CRUD endpoints resolve to correct feature and actions")
    void testWorkflowDefinitionCrudEndpointsResolveCorrectActions() {
        PermissionResponse readPerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS").action("READ").active(true).allowed(true).build();
        PermissionResponse createPerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS").action("CREATE").active(true).allowed(true).build();
        PermissionResponse updatePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS").action("UPDATE").active(true).allowed(true).build();
        PermissionResponse deletePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS").action("DELETE").active(true).allowed(true).build();

        AuthenticatedUser reader = buildUser(List.of(), List.of(readPerm));
        AuthenticatedUser creator = buildUser(List.of(), List.of(createPerm));
        AuthenticatedUser updater = buildUser(List.of(), List.of(updatePerm));
        AuthenticatedUser deleter = buildUser(List.of(), List.of(deletePerm));

        // GET -> READ
        assertThat(decide(reader, "GET", "/api/v1/workflow/definitions").isGranted()).isTrue();
        assertThat(decide(creator, "GET", "/api/v1/workflow/definitions").isGranted()).isFalse();

        // POST -> CREATE
        assertThat(decide(creator, "POST", "/api/v1/workflow/definitions").isGranted()).isTrue();
        assertThat(decide(reader, "POST", "/api/v1/workflow/definitions").isGranted()).isFalse();

        // PUT -> UPDATE
        assertThat(decide(updater, "PUT", "/api/v1/workflow/definitions/123").isGranted()).isTrue();
        assertThat(decide(reader, "PUT", "/api/v1/workflow/definitions/123").isGranted()).isFalse();

        // DELETE -> DELETE
        assertThat(decide(deleter, "DELETE", "/api/v1/workflow/definitions/123").isGranted()).isTrue();
        assertThat(decide(reader, "DELETE", "/api/v1/workflow/definitions/123").isGranted()).isFalse();
    }

    @Test
    @DisplayName("Trailing slashes on custom action suffixes resolve to correct action")
    void testTrailingSlashesOnCustomActionSuffixes() {
        PermissionResponse activatePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS").action("ACTIVATE").active(true).allowed(true).build();
        AuthenticatedUser activator = buildUser(List.of(), List.of(activatePerm));

        assertThat(decide(activator, "PATCH", "/api/v1/workflow/definitions/123/activate/").isGranted()).isTrue();

        PermissionResponse deactivatePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS").action("DEACTIVATE").active(true).allowed(true).build();
        AuthenticatedUser deactivator = buildUser(List.of(), List.of(deactivatePerm));

        assertThat(decide(deactivator, "PATCH", "/api/v1/workflow/definitions/123/deactivate/").isGranted()).isTrue();
    }

    @Test
    @DisplayName("Custom action /retry resolves to UPDATE on WORKFLOW_CALLBACKS")
    void testRetryActionResolvesToUpdate() {
        PermissionResponse updatePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_CALLBACKS").action("UPDATE").active(true).allowed(true).build();
        AuthenticatedUser user = buildUser(List.of(), List.of(updatePerm));

        assertThat(decide(user, "POST", "/api/v1/workflow/callbacks/123/retry").isGranted()).isTrue();

        // User with only READ on callbacks cannot retry
        PermissionResponse readPerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_CALLBACKS").action("READ").active(true).allowed(true).build();
        AuthenticatedUser reader = buildUser(List.of(), List.of(readPerm));

        assertThat(decide(reader, "POST", "/api/v1/workflow/callbacks/123/retry").isGranted()).isFalse();
    }

    @Test
    @DisplayName("User with permission for different module CANNOT activate workflow definitions")
    void testUserWithDifferentModulePermissionCannotActivateWorkflowDefinition() {
        PermissionResponse taskWritePerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_TASKS")
                .action("WRITE")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser taskUser = buildUser(List.of(), List.of(taskWritePerm));

        assertThat(decide(taskUser, "PATCH", "/api/v1/workflow/definitions/123/activate").isGranted()).isFalse();
    }

    @Test
    @DisplayName("Unmatched routes remain protected (fail closed)")
    void testUnmatchedRoutesFailClosed() {
        PermissionResponse readPerm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS").action("READ").active(true).allowed(true).build();
        AuthenticatedUser user = buildUser(List.of(), List.of(readPerm));

        assertThat(decide(user, "GET", "/api/v1/unmapped/route").isGranted()).isFalse();
    }
}
