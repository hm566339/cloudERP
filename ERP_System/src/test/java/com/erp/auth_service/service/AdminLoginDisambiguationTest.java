package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.LoginRequest;
import com.erp.auth_service.dto.response.LoginResponse;
import com.erp.auth_service.exception.AccountLockedException;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.InvalidOperationException;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.AuthorizationCodeMapper;
import com.erp.auth_service.mapper.SsoSessionMapper;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminLoginDisambiguationTest {

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
    @Mock
    private OrganizationResolverService organizationResolverService;
    @Mock
    private OrganizationMemberRepository organizationMemberRepository;
    @Mock
    private MemberCompanyAccessRepository memberCompanyAccessRepository;
    @Mock
    private SubscriptionRepository subscriptionRepository;
    @Mock
    private RefreshTokenRecordRepository refreshTokenRecordRepository;
    @Mock
    private OrganizationModuleRepository organizationModuleRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    private Company rootCompany;
    private Role systemAdminRole;
    private Role operatorRole;
    private Module systemAdminModule;

    @BeforeEach
    void setUp() {
        rootCompany = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("000000")
                .companyName("Root Admin Co")
                .build();

        systemAdminRole = Role.builder()
                .id(UUID.randomUUID())
                .name("SYSTEM_ADMIN")
                .build();

        operatorRole = Role.builder()
                .id(UUID.randomUUID())
                .name("OPERATOR")
                .build();

        systemAdminModule = Module.builder()
                .id(UUID.randomUUID())
                .name("SYSTEM_ADMIN")
                .moduleStatus(true)
                .build();
    }

    private User buildAdminUser(String username, String email, String rawPassword, Role... roles) {
        User user = User.builder()
                .id(UUID.randomUUID())
                .username(username)
                .email(email)
                .password("encoded_pass")
                .company(rootCompany)
                .accountStatus(AccountStatus.ACTIVE)
                .emailStatus(Status.VERIFIED)
                .failedLoginCount(0)
                .build();

        List<UserRole> userRoles = new ArrayList<>();
        if (roles.length == 0) {
            userRoles.add(UserRole.builder().user(user).role(systemAdminRole).build());
        } else {
            for (Role r : roles) {
                userRoles.add(UserRole.builder().user(user).role(r).build());
            }
        }
        user.setUserRoles(userRoles);
        return user;
    }

    private void stubSuccessfulAuth(String username) {
        when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));
        when(passwordEncoder.matches("secret123", "encoded_pass")).thenReturn(true);
        when(moduleRepository.findByNameIgnoreCase("SYSTEM_ADMIN")).thenReturn(Optional.of(systemAdminModule));
        when(jwtService.generateAccessToken(eq(username), any())).thenReturn("mock_access_token");
        when(jwtService.generateRefreshToken(eq(username), eq("000000"))).thenReturn("mock_refresh_token");
    }

    @Test
    @DisplayName("1. Login by username succeeds")
    void testAdminLogin_byUsername_success() {
        User user = buildAdminUser("admin_john", "admin_john@mark2.in", "secret123");
        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "admin_john"))
                .thenReturn(List.of(user));
        stubSuccessfulAuth("admin_john");

        LoginRequest request = new LoginRequest();
        request.setUsername("admin_john");
        request.setPassword("secret123");

        LoginResponse response = authService.adminLogin(request, "127.0.0.1", "TestAgent");

        assertNotNull(response);
        assertEquals("mock_access_token", response.getAccessToken());
        assertEquals("mock_refresh_token", response.getRefreshToken());
        verify(passwordEncoder).matches("secret123", "encoded_pass");
        verify(sessionRepository).save(any(Session.class));
    }

    @Test
    @DisplayName("2. Login by email succeeds")
    void testAdminLogin_byEmail_success() {
        User user = buildAdminUser("admin_john", "admin@mark2.in", "secret123");
        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "admin@mark2.in"))
                .thenReturn(List.of(user));
        stubSuccessfulAuth("admin_john");

        LoginRequest request = new LoginRequest();
        request.setUsername("admin@mark2.in");
        request.setPassword("secret123");

        LoginResponse response = authService.adminLogin(request, "127.0.0.1", "TestAgent");

        assertNotNull(response);
        assertEquals("mock_access_token", response.getAccessToken());
        verify(passwordEncoder).matches("secret123", "encoded_pass");
    }

    @Test
    @DisplayName("3. Case-insensitive matching succeeds for username and email")
    void testAdminLogin_caseInsensitiveMatching_success() {
        User user = buildAdminUser("superadmin", "superadmin@mark2.in", "secret123");
        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "SuperAdmin@Mark2.In"))
                .thenReturn(List.of(user));
        stubSuccessfulAuth("superadmin");

        LoginRequest request = new LoginRequest();
        request.setUsername("SuperAdmin@Mark2.In");
        request.setPassword("secret123");

        LoginResponse response = authService.adminLogin(request, "127.0.0.1", "TestAgent");

        assertNotNull(response);
        assertEquals("mock_access_token", response.getAccessToken());
        verify(passwordEncoder).matches("secret123", "encoded_pass");
    }

    @Test
    @DisplayName("4a. Disambiguates when username of one matches email of another (username input)")
    void testAdminLogin_usernameOfOneMatchesEmailOfAnother_disambiguatesSafely_usernameInput() {
        User user1 = buildAdminUser("admin", "other_email@mark2.in", "secret123");
        User user2 = buildAdminUser("other_user", "admin@mark2.in", "secret123");

        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "admin"))
                .thenReturn(List.of(user1, user2));
        stubSuccessfulAuth("admin");

        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("secret123");

        LoginResponse response = authService.adminLogin(request, "127.0.0.1", "TestAgent");

        assertNotNull(response);
        assertEquals("mock_access_token", response.getAccessToken());
        // Must authenticate user1 (exact username match for non-email input)
        verify(jwtService).generateAccessToken(eq("admin"), any());
    }

    @Test
    @DisplayName("4b. Disambiguates when username of one matches email of another (email input)")
    void testAdminLogin_usernameOfOneMatchesEmailOfAnother_disambiguatesSafely_emailInput() {
        User user1 = buildAdminUser("admin_john", "admin@mark2.in", "secret123");
        User user2 = buildAdminUser("admin@mark2.in", "other@mark2.in", "secret123");

        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "admin@mark2.in"))
                .thenReturn(List.of(user1, user2));
        stubSuccessfulAuth("admin_john");

        LoginRequest request = new LoginRequest();
        request.setUsername("admin@mark2.in");
        request.setPassword("secret123");

        LoginResponse response = authService.adminLogin(request, "127.0.0.1", "TestAgent");

        assertNotNull(response);
        // Must authenticate user1 (exact email match for email-formatted input)
        verify(jwtService).generateAccessToken(eq("admin_john"), any());
    }

    @Test
    @DisplayName("5. Rejects login safely if multiple duplicate database records match identically")
    void testAdminLogin_duplicateDatabaseRecords_throwsBadCredentialsException() {
        when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));

        // Two duplicate records with identical email
        User user1 = buildAdminUser("admin1", "admin@mark2.in", "secret123");
        User user2 = buildAdminUser("admin2", "admin@mark2.in", "secret123");

        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "admin@mark2.in"))
                .thenReturn(List.of(user1, user2));

        LoginRequest request = new LoginRequest();
        request.setUsername("admin@mark2.in");
        request.setPassword("secret123");

        BadCredentialsException exception = assertThrows(BadCredentialsException.class,
                () -> authService.adminLogin(request, "127.0.0.1", "TestAgent"));

        assertTrue(exception.getMessage().contains("Ambiguous user identity"));
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("6. User having multiple roles authenticates correctly without duplicate issues")
    void testAdminLogin_userWithMultipleRoles_success() {
        // User has both SYSTEM_ADMIN and OPERATOR roles
        User multiRoleUser = buildAdminUser("super_admin", "super_admin@mark2.in", "secret123",
                systemAdminRole, operatorRole);

        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "super_admin"))
                .thenReturn(List.of(multiRoleUser));
        stubSuccessfulAuth("super_admin");

        LoginRequest request = new LoginRequest();
        request.setUsername("super_admin");
        request.setPassword("secret123");

        LoginResponse response = authService.adminLogin(request, "127.0.0.1", "TestAgent");

        assertNotNull(response);
        assertEquals("mock_access_token", response.getAccessToken());
        verify(passwordEncoder).matches("secret123", "encoded_pass");
    }

    @Test
    @DisplayName("7. Invalid credentials (password mismatch) increments failed count and throws BadCredentialsException")
    void testAdminLogin_invalidPassword_incrementsCountAndThrowsBadCredentials() {
        when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));
        User user = buildAdminUser("admin_john", "admin@mark2.in", "secret123");
        user.setFailedLoginCount(1);

        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "admin_john"))
                .thenReturn(List.of(user));
        when(passwordEncoder.matches("wrong_pass", "encoded_pass")).thenReturn(false);

        LoginRequest request = new LoginRequest();
        request.setUsername("admin_john");
        request.setPassword("wrong_pass");

        BadCredentialsException exception = assertThrows(BadCredentialsException.class,
                () -> authService.adminLogin(request, "127.0.0.1", "TestAgent"));

        assertEquals("Invalid credentials", exception.getMessage());
        assertEquals(2, user.getFailedLoginCount());
        verify(userRepository).save(user);
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("8. Disabled account (INACTIVE) throws InvalidOperationException")
    void testAdminLogin_disabledAccount_throwsInvalidOperationException() {
        when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));
        User user = buildAdminUser("admin_john", "admin@mark2.in", "secret123");
        user.setAccountStatus(AccountStatus.INACTIVE);

        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "admin_john"))
                .thenReturn(List.of(user));

        LoginRequest request = new LoginRequest();
        request.setUsername("admin_john");
        request.setPassword("secret123");

        InvalidOperationException exception = assertThrows(InvalidOperationException.class,
                () -> authService.adminLogin(request, "127.0.0.1", "TestAgent"));

        assertEquals("Your account is inactive", exception.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("9. Unverified email throws InvalidOperationException")
    void testAdminLogin_unverifiedEmail_throwsInvalidOperationException() {
        when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));
        User user = buildAdminUser("admin_john", "admin@mark2.in", "secret123");
        user.setEmailStatus(Status.UNVERIFIED);

        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "admin_john"))
                .thenReturn(List.of(user));

        LoginRequest request = new LoginRequest();
        request.setUsername("admin_john");
        request.setPassword("secret123");

        InvalidOperationException exception = assertThrows(InvalidOperationException.class,
                () -> authService.adminLogin(request, "127.0.0.1", "TestAgent"));

        assertEquals("Email is not verified", exception.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("10. Locked account throws AccountLockedException")
    void testAdminLogin_lockedAccount_throwsAccountLockedException() {
        when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));
        User user = buildAdminUser("admin_john", "admin@mark2.in", "secret123");
        user.setLockedUntil(LocalDateTime.now().plusHours(1));

        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "admin_john"))
                .thenReturn(List.of(user));

        LoginRequest request = new LoginRequest();
        request.setUsername("admin_john");
        request.setPassword("secret123");

        assertThrows(AccountLockedException.class,
                () -> authService.adminLogin(request, "127.0.0.1", "TestAgent"));

        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("11. Rejects user existing only in non-root company")
    void testAdminLogin_nonRootCompanyCandidate_throwsBadCredentialsException() {
        when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));

        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "admin@mark2.in"))
                .thenReturn(Collections.emptyList());

        User otherTenantUser = buildAdminUser("tenant_admin", "admin@mark2.in", "pass");
        otherTenantUser.setCompany(Company.builder().id(UUID.randomUUID()).companyCode("111111").build());
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCaseWithRoles("admin@mark2.in", "admin@mark2.in"))
                .thenReturn(List.of(otherTenantUser));

        LoginRequest request = new LoginRequest();
        request.setUsername("admin@mark2.in");
        request.setPassword("secret123");

        BadCredentialsException exception = assertThrows(BadCredentialsException.class,
                () -> authService.adminLogin(request, "127.0.0.1", "TestAgent"));

        assertTrue(exception.getMessage().contains("You are not authorized for admin login"));
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("12. User in root company lacking SYSTEM_ADMIN role is rejected")
    void testAdminLogin_lackingSystemAdminRole_throwsBadCredentialsException() {
        when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));

        // User only has OPERATOR role, not SYSTEM_ADMIN
        User nonAdmin = buildAdminUser("operator_user", "operator@mark2.in", "secret123", operatorRole);

        when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(), "operator_user"))
                .thenReturn(List.of(nonAdmin));

        LoginRequest request = new LoginRequest();
        request.setUsername("operator_user");
        request.setPassword("secret123");

        BadCredentialsException exception = assertThrows(BadCredentialsException.class,
                () -> authService.adminLogin(request, "127.0.0.1", "TestAgent"));

        assertTrue(exception.getMessage().contains("You are not authorized for admin login"));
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }
}
