package com.erp.auth_service.service;

import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.TokenVerifyResponse;
import com.erp.auth_service.dto.response.UserFeatureDto;
import com.erp.auth_service.dto.response.UserPermissionDetailDto;
import com.erp.auth_service.dto.response.UserResponse;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.AuthorizationCodeMapper;
import com.erp.auth_service.mapper.SsoSessionMapper;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.Session;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserPortalAccess;
import com.erp.auth_service.repository.AuthorizationCodeRepository;
import com.erp.auth_service.repository.CompanyModuleRepository;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.repository.UserPortalAccessRepository;
import com.erp.auth_service.repository.UserRepository;
import com.erp.auth_service.repository.UserRoleRepository;
import com.erp.auth_service.repository.UserTokenRepository;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.utility.AccountStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplVerifyTokenTest {

        @Mock
        private UserRepository userRepository;
        @Mock
        private ModuleRepository moduleRepository;
        @Mock
        private SessionRepository sessionRepository;
        @Mock
        private AuthorizationCodeRepository authorizationCodeRepository;
        @Mock
        private AuthorizationCodeMapper authorizationCodeMapper;
        @Mock
        private PasswordEncoder passwordEncoder;
        @Mock
        private JwtService jwtService;
        @Mock
        private JwtDecoder jwtDecoder;
        @Mock
        private EmailService emailService;
        @Mock
        private UserTokenRepository userTokenRepository;
        @Mock
        private UserMapper userMapper;
        @Mock
        private SsoSessionMapper ssoSessionMapper;
        @Mock
        private UserPortalAccessRepository userPortalAccessRepository;
        @Mock
        private UserRoleRepository userRoleRepository;
        @Mock
        private RoleRepository roleRepository;
        @Mock
        private CompanyRepository companyRepository;
        @Mock
        private CompanyModuleRepository companyModuleRepository;
        @Mock
        private PermissionService permissionService;

        @InjectMocks
        private AuthServiceImpl authService;

        private final String accessToken = "valid.jwt.access.token";
        private UUID userId;
        private UUID companyId;
        private UUID moduleId;
        private UUID companyModuleId;
        private Company company;
        private User user;
        private Session session;

        @BeforeEach
        void setUp() {
                userId = UUID.randomUUID();
                companyId = UUID.randomUUID();
                moduleId = UUID.randomUUID();
                companyModuleId = UUID.randomUUID();

                company = Company.builder()
                                .id(companyId)
                                .companyCode("COMP001")
                                .companyName("Test Enterprise")
                                .build();

                user = User.builder()
                                .id(userId)
                                .username("john.accountant")
                                .company(company)
                                .accountStatus(AccountStatus.ACTIVE)
                                .build();

                session = Session.builder()
                                .id(UUID.randomUUID())
                                .user(user)
                                .company(company)
                                .module(Module.builder()
                                                .id(moduleId)
                                                .name("ACCOUNT")
                                                .moduleStatus(true)
                                                .build())
                                .accessToken(accessToken)
                                .accessTokenValidTill(LocalDateTime.now().plusMinutes(15))
                                .refreshToken("refresh-token")
                                .refreshTokenValidTill(LocalDateTime.now().plusDays(7))
                                .build();
        }

        private void stubValidFlow() {
                when(jwtDecoder.isTokenValid(accessToken)).thenReturn(true);
                when(sessionRepository.findByAccessToken(accessToken)).thenReturn(Optional.of(session));
                when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(companyId, moduleId))
                                .thenReturn(Optional.of(CompanyModule.builder()
                                                .id(companyModuleId)
                                                .company(company)
                                                .module(session.getModule())
                                                .active(true)
                                                .build()));
                when(userRepository.findByIdWithRoles(userId)).thenReturn(Optional.of(user));
                when(userPortalAccessRepository.findByUser_IdAndCompanyModule_IdAndStatusTrue(userId, companyModuleId))
                                .thenReturn(Optional.of(UserPortalAccess.builder()
                                                .id(UUID.randomUUID())
                                                .user(user)
                                                .companyModule(CompanyModule.builder().id(companyModuleId).build())
                                                .status(true)
                                                .build()));
        }

        private EffectivePermissionsResponse effectiveResponse() {
                UserPermissionDetailDto dashboardRead = UserPermissionDetailDto.builder()
                                .featureCode("DASHBOARD")
                                .action("READ")
                                .permissionCode("DASHBOARD:READ")
                                .moduleName("ACCOUNT")
                                .source("ROLE")
                                .active(true)
                                .allowed(true)
                                .build();
                UserPermissionDetailDto customersRead = UserPermissionDetailDto.builder()
                                .featureCode("CUSTOMERS")
                                .action("READ")
                                .permissionCode("CUSTOMERS:READ")
                                .moduleName("ACCOUNT")
                                .source("USER_GRANTED")
                                .active(true)
                                .allowed(true)
                                .build();
                UserFeatureDto dashboardFeature = UserFeatureDto.builder()
                                .featureCode("DASHBOARD")
                                .featureName("Dashboard")
                                .moduleName("ACCOUNT")
                                .source("ROLE")
                                .build();
                UserFeatureDto customersFeature = UserFeatureDto.builder()
                                .featureCode("CUSTOMERS")
                                .featureName("Customers")
                                .moduleName("ACCOUNT")
                                .source("USER_GRANTED")
                                .build();
                return EffectivePermissionsResponse.builder()
                                .userId(userId)
                                .roles(List.of("FINANCE_MANAGER"))
                                .features(List.of(dashboardFeature, customersFeature))
                                .permissions(List.of(dashboardRead, customersRead))
                                .build();
        }

        @Test
        @DisplayName("Valid token returns non-empty permissions and features")
        void validToken_returnsPermissionsAndFeatures() {
                stubValidFlow();
                EffectivePermissionsResponse effective = effectiveResponse();
                when(permissionService.getEffectivePermissions(userId, companyId)).thenReturn(effective);
                UserResponse mapped = UserResponse.builder()
                                .id(userId)
                                .username("john.accountant")
                                .build();
                when(userMapper.toResponse(user)).thenReturn(mapped);

                TokenVerifyResponse response = authService.verifyToken(accessToken);

                assertTrue(response.isValid());
                assertNotNull(response.getUser());
                assertSame(effective.getFeatures(), response.getUser().getFeatures());
                assertSame(effective.getPermissions(), response.getUser().getPermissions());
                assertFalse(response.getUser().getFeatures().isEmpty());
                assertFalse(response.getUser().getPermissions().isEmpty());
        }

        @Test
        @DisplayName("Valid token returns DASHBOARD:READ")
        void validToken_includesDashboardRead() {
                stubValidFlow();
                when(permissionService.getEffectivePermissions(userId, companyId)).thenReturn(effectiveResponse());
                when(userMapper.toResponse(user)).thenReturn(UserResponse.builder().id(userId).build());

                TokenVerifyResponse response = authService.verifyToken(accessToken);

                assertTrue(response.isValid());
                assertTrue(response.getUser().getPermissions().stream()
                                .anyMatch(p -> "DASHBOARD:READ".equals(p.getPermissionCode())
                                                && p.isActive() && p.isAllowed()));
        }

        @Test
        @DisplayName("Valid token returns CUSTOMERS:READ")
        void validToken_includesCustomersRead() {
                stubValidFlow();
                when(permissionService.getEffectivePermissions(userId, companyId)).thenReturn(effectiveResponse());
                when(userMapper.toResponse(user)).thenReturn(UserResponse.builder().id(userId).build());

                TokenVerifyResponse response = authService.verifyToken(accessToken);

                assertTrue(response.isValid());
                assertTrue(response.getUser().getPermissions().stream()
                                .anyMatch(p -> "CUSTOMERS:READ".equals(p.getPermissionCode())
                                                && p.isActive() && p.isAllowed()));
        }

        @Test
        @DisplayName("Valid token preserves full permission fields on verify response")
        void validToken_preservesPermissionDetailFields() {
                stubValidFlow();
                when(permissionService.getEffectivePermissions(userId, companyId)).thenReturn(effectiveResponse());
                when(userMapper.toResponse(user)).thenReturn(UserResponse.builder().id(userId).build());

                TokenVerifyResponse response = authService.verifyToken(accessToken);

                UserPermissionDetailDto dashboardRead = response.getUser().getPermissions().stream()
                                .filter(p -> "DASHBOARD:READ".equals(p.getPermissionCode()))
                                .findFirst().orElse(null);
                assertNotNull(dashboardRead);
                assertEquals("DASHBOARD", dashboardRead.getFeatureCode());
                assertEquals("READ", dashboardRead.getAction());
                assertEquals("ACCOUNT", dashboardRead.getModuleName());
                assertEquals("ROLE", dashboardRead.getSource());
                assertTrue(dashboardRead.isActive());
                assertTrue(dashboardRead.isAllowed());
        }

        @Test
        @DisplayName("User without permissions does not receive fabricated permissions")
        void validToken_withoutPermissions_returnsEmptyLists() {
                stubValidFlow();
                EffectivePermissionsResponse empty = EffectivePermissionsResponse.builder()
                                .userId(userId)
                                .roles(List.of())
                                .features(List.of())
                                .permissions(List.of())
                                .build();
                when(permissionService.getEffectivePermissions(userId, companyId)).thenReturn(empty);
                when(userMapper.toResponse(user)).thenReturn(UserResponse.builder().id(userId).build());

                TokenVerifyResponse response = authService.verifyToken(accessToken);

                assertTrue(response.isValid());
                assertNotNull(response.getUser().getFeatures());
                assertNotNull(response.getUser().getPermissions());
                assertTrue(response.getUser().getFeatures().isEmpty());
                assertTrue(response.getUser().getPermissions().isEmpty());
        }

        @Test
        @DisplayName("Invalid token is rejected")
        void invalidToken_isRejected() {
                when(jwtDecoder.isTokenValid("bad-token")).thenReturn(false);

                TokenVerifyResponse response = authService.verifyToken("bad-token");

                assertFalse(response.isValid());
                assertNull(response.getUser());
                verify(permissionService, never()).getEffectivePermissions(any());
        }

        @Test
        @DisplayName("authorize: Cross-user spoofing is rejected with User mismatch")
        void authorize_crossUserSpoofing_rejectedWithUserMismatch() {
                UUID otherUserId = UUID.randomUUID();
                when(jwtDecoder.isTokenValid(accessToken)).thenReturn(true);
                when(jwtDecoder.extractUserId(accessToken)).thenReturn(userId);

                Session activeSession = Session.builder()
                                .accessToken(accessToken)
                                .accessTokenValidTill(LocalDateTime.now().plusHours(1))
                                .user(user)
                                .company(company)
                                .build();
                when(sessionRepository.findByAccessToken(accessToken)).thenReturn(Optional.of(activeSession));

                Map<String, Object> result = authService.authorize(accessToken, otherUserId, moduleId);

                assertNotNull(result);
                assertEquals(false, result.get("authorized"));
                assertEquals("User mismatch", result.get("reason"));
                verify(authorizationCodeRepository, never()).save(any());
        }
}