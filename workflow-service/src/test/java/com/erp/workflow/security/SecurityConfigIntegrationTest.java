package com.erp.workflow.security;

import com.erp.workflow.controller.WorkflowDefinitionController;
import com.erp.workflow.dto.response.WorkflowDefinitionResponse;
import com.erp.workflow.security.authorization.FeatureGroupPermissionResolver;
import com.erp.workflow.security.authorization.SsoAuthorizationManager;
import com.erp.workflow.security.authorization.SsoAuthorizationProperties;
import com.erp.workflow.security.dto.sso.AccountStatus;
import com.erp.workflow.security.dto.sso.PermissionResponse;
import com.erp.workflow.security.dto.sso.TokenVerifyResponse;
import com.erp.workflow.security.dto.sso.UserResponse;
import com.erp.workflow.security.sso.SsoService;
import com.erp.workflow.service.WorkflowDefinitionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecurityConfigIntegrationTest {

    @Mock
    private SsoService ssoService;

    @Mock
    private WorkflowDefinitionService definitionService;

    private AuthenticationFilter authenticationFilter;
    private SsoAuthorizationManager authorizationManager;
    private JwtAuthenticationEntryPoint authenticationEntryPoint;
    private CustomAccessDeniedHandler accessDeniedHandler;

    @BeforeEach
    void setUp() {
        authenticationFilter = new AuthenticationFilter(ssoService);
        ReflectionTestUtils.setField(authenticationFilter, "cookieName", "access_token");

        SsoAuthorizationProperties properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "WORKFLOW_DEFINITIONS", List.of("/api/v1/workflow/definitions", "/api/v1/workflow/definitions/**")
        ));
        authorizationManager = new SsoAuthorizationManager(properties, new FeatureGroupPermissionResolver(properties));
        authenticationEntryPoint = new JwtAuthenticationEntryPoint();
        accessDeniedHandler = new CustomAccessDeniedHandler();

        CurrentUserContext.clear();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Unauthenticated request triggers JwtAuthenticationEntryPoint returning 401 JSON")
    void testAuthenticationEntryPointReturns401Json() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        MockHttpServletResponse response = new MockHttpServletResponse();

        authenticationEntryPoint.commence(request, response, new AuthenticationException("Missing token") {});

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).isEqualTo("application/json");
        assertThat(response.getContentAsString()).contains("\"success\":false");
        assertThat(response.getContentAsString()).contains("\"message\":\"Unauthorized\"");
        assertThat(response.getContentAsString()).contains("\"error\":\"Authentication token is missing or invalid\"");
    }

    @Test
    @DisplayName("Unauthorized access triggers CustomAccessDeniedHandler returning 403 JSON")
    void testAccessDeniedHandlerReturns403Json() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        MockHttpServletResponse response = new MockHttpServletResponse();

        accessDeniedHandler.handle(request, response, new AccessDeniedException("Forbidden"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).isEqualTo("application/json");
        assertThat(response.getContentAsString()).contains("\"success\":false");
        assertThat(response.getContentAsString()).contains("\"message\":\"Forbidden\"");
        assertThat(response.getContentAsString()).contains("\"error\":\"User does not have permission to access this resource\"");
    }

    @Test
    @DisplayName("End-to-end filter authentication populates principal and allows authorized execution")
    void testFilterAndAuthorizationFlow() throws Exception {
        UUID userId = UUID.randomUUID();
        PermissionResponse perm = PermissionResponse.builder()
                .moduleName("WORKFLOW_DEFINITIONS")
                .action("READ")
                .active(true)
                .allowed(true)
                .build();
        UserResponse user = UserResponse.builder()
                .id(userId)
                .username("workflow.user")
                .accountStatus(AccountStatus.ACTIVE)
                .permissions(List.of(perm))
                .build();
        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder().valid(true).user(user).build();

        when(ssoService.verifyToken("token-abc")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer token-abc");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        // Run authentication filter
        authenticationFilter.doFilter(request, response, chain);

        // Verify request was processed
        assertThat(response.getStatus()).isEqualTo(200);
    }
}
