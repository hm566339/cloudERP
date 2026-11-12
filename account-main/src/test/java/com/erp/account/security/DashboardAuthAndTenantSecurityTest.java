package com.erp.account.security;

import com.erp.account.common.exception.ExternalServiceException;
import com.erp.account.common.handler.GlobalExceptionHandler;
import com.erp.account.modules.auth.dto.ssoresponse.AccountStatus;
import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.account.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.account.modules.auth.dto.ssoresponse.UserResponse;
import com.erp.account.modules.auth.service.SsoService;
import com.erp.account.modules.company.service.CompanyBootstrapService;
import com.erp.account.modules.dashboard.controller.DashboardController;
import com.erp.account.modules.dashboard.dto.response.DashboardResponse;
import com.erp.account.modules.dashboard.service.DashboardService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DashboardAuthAndTenantSecurityTest {

    @Mock
    private SsoService ssoService;

    @Mock
    private CompanyBootstrapService companyBootstrapService;

    @Mock
    private DashboardService dashboardService;

    private MockMvc mockMvc;
    private AuthenticationFilter authenticationFilter;

    private UUID companyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();
        authenticationFilter = new AuthenticationFilter(companyBootstrapService, ssoService);
        mockMvc = MockMvcBuilders.standaloneSetup(new DashboardController(dashboardService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(authenticationFilter)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        CurrentUserContext.clear();
    }

    private TokenVerifyResponse validNonOwnerVerifyResponse() {
        PermissionResponse readPerm = PermissionResponse.builder()
                .permissionCode("DASHBOARD:READ")
                .action("READ")
                .featureCode("DASHBOARD")
                .moduleName("DASHBOARD")
                .active(true)
                .allowed(true)
                .build();

        UserResponse user = UserResponse.builder()
                .id(userId)
                .username("accountant@apex.com")
                .companyCode("APEX01")
                .fullName("Mohit Kumar")
                .accountStatus(AccountStatus.ACTIVE)
                .role(List.of(RoleResponse.builder().name("Accountant").status(true).build()))
                .permissions(List.of(readPerm))
                .build();

        return TokenVerifyResponse.builder()
                .valid(true)
                .user(user)
                .build();
    }

    @Test
    @DisplayName("GET /api/account/dashboard returns 200 for authenticated non-owner when company bootstrap succeeds")
    void dashboardReturns200WithVerifiedCompanyContext() throws Exception {
        when(ssoService.verifyToken("valid-jwt")).thenReturn(validNonOwnerVerifyResponse());
        when(companyBootstrapService.ensureCompanyByCode("APEX01", "valid-jwt")).thenReturn(companyId);
        when(dashboardService.getDashboard(any())).thenAnswer(inv -> {
            // Confirm tenant context was set by AuthenticationFilter before reaching dashboard service
            assertThat(CurrentUserContext.getCompanyId()).isEqualTo(companyId);
            return DashboardResponse.builder().build();
        });

        mockMvc.perform(get("/api/account/dashboard")
                        .header("Authorization", "Bearer valid-jwt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Denied company verification fails closed with 403 rather than bogus 401 refresh loop")
    void companyVerificationFailureReturns403Not401() throws Exception {
        when(ssoService.verifyToken("valid-jwt")).thenReturn(validNonOwnerVerifyResponse());
        when(companyBootstrapService.ensureCompanyByCode("APEX01", "valid-jwt"))
                .thenThrow(new ExternalServiceException("403 PERMISSION_DENIED on /api/sso/company/company-verify"));

        mockMvc.perform(get("/api/account/dashboard")
                        .header("Authorization", "Bearer valid-jwt"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(CurrentUserContext.getCompanyId()).isNull();
    }
}

