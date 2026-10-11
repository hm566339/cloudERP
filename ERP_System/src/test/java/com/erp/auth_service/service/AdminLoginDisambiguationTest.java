// package com.erp.auth_service.service;

// import com.erp.auth_service.dto.request.LoginRequest;
// import com.erp.auth_service.dto.response.LoginResponse;
// import com.erp.auth_service.exception.BadCredentialsException;
// import com.erp.auth_service.mail.EmailService;
// import com.erp.auth_service.model.*;
// import com.erp.auth_service.model.Module;
// import com.erp.auth_service.repository.*;
// import com.erp.auth_service.security.JwtDecoder;
// import com.erp.auth_service.security.JwtService;
// import com.erp.auth_service.service.impl.AuthServiceImpl;
// import com.erp.auth_service.utility.AccountStatus;
// import com.erp.auth_service.utility.Status;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.DisplayName;
// import org.junit.jupiter.api.Test;
// import org.junit.jupiter.api.extension.ExtendWith;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.junit.jupiter.MockitoExtension;
// import org.springframework.security.crypto.password.PasswordEncoder;

// import java.time.LocalDateTime;
// import java.util.*;

// import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.any;
// import static org.mockito.ArgumentMatchers.anyString;
// import static org.mockito.Mockito.*;

// @ExtendWith(MockitoExtension.class)
// class AdminLoginDisambiguationTest {

// @Mock
// private UserRepository userRepository;
// @Mock
// private ModuleRepository moduleRepository;
// @Mock
// private SessionRepository sessionRepository;
// @Mock
// private AuthorizationCodeRepository authorizationCodeRepository;
// @Mock
// private PasswordEncoder passwordEncoder;
// @Mock
// private JwtService jwtService;
// @Mock
// private JwtDecoder jwtDecoder;
// @Mock
// private EmailService emailService;
// @Mock
// private UserTokenRepository userTokenRepository;
// @Mock
// private UserPortalAccessRepository userPortalAccessRepository;
// @Mock
// private UserRoleRepository userRoleRepository;
// @Mock
// private RoleRepository roleRepository;
// @Mock
// private CompanyRepository companyRepository;
// @Mock
// private CompanyModuleRepository companyModuleRepository;
// @Mock
// private PermissionService permissionService;
// @Mock
// private OrganizationResolverService organizationResolverService;
// @Mock
// private OrganizationMemberRepository organizationMemberRepository;
// @Mock
// private MemberCompanyAccessRepository memberCompanyAccessRepository;
// @Mock
// private SubscriptionRepository subscriptionRepository;
// @Mock
// private RefreshTokenRecordRepository refreshTokenRecordRepository;
// @Mock
// private OrganizationModuleRepository organizationModuleRepository;

// @InjectMocks
// private AuthServiceImpl authService;

// private Company rootCompany;
// private Role systemAdminRole;
// private Module systemAdminModule;

// @BeforeEach
// void setUp() {
// rootCompany = Company.builder()
// .id(UUID.randomUUID())
// .companyCode("000000")
// .companyName("Root Admin Co")
// .build();

// systemAdminRole = Role.builder()
// .id(UUID.randomUUID())
// .name("SYSTEM_ADMIN")
// .build();

// systemAdminModule = Module.builder()
// .id(UUID.randomUUID())
// .name("SYSTEM_ADMIN")
// .moduleStatus(true)
// .build();
// }

// private User buildAdminUser(String username, String email, String
// rawPassword) {
// User user = User.builder()
// .id(UUID.randomUUID())
// .username(username)
// .email(email)
// .password("encoded_pass")
// .company(rootCompany)
// .accountStatus(AccountStatus.ACTIVE)
// .emailStatus(Status.VERIFIED)
// .failedLoginCount(0)
// .build();

// UserRole userRole = UserRole.builder()
// .id(UUID.randomUUID())
// .user(user)
// .role(systemAdminRole)
// .build();

// user.setUserRoles(List.of(userRole));
// return user;
// }

// @Test
// @DisplayName("1. Disambiguates exact username match when multiple users match
// input")
// void testAdminLogin_exactUsernameDisambiguation_succeeds() {
// when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));

// User user1 = buildAdminUser("admin", "other_email@mark2.in", "secret123");
// User user2 = buildAdminUser("other_user", "admin@mark2.in", "secret123");

// when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(),
// "admin"))
// .thenReturn(List.of(user1, user2));

// when(passwordEncoder.matches("secret123", "encoded_pass")).thenReturn(true);
// when(moduleRepository.findByNameIgnoreCase("SYSTEM_ADMIN")).thenReturn(Optional.of(systemAdminModule));
// when(jwtService.generateAccessToken(eq("admin"),
// any())).thenReturn("mock_access_token");
// when(jwtService.generateRefreshToken(eq("admin"),
// eq("000000"))).thenReturn("mock_refresh_token");

// LoginRequest request = new LoginRequest();
// request.setUsername("admin");
// request.setPassword("secret123");

// LoginResponse response = authService.adminLogin(request, "127.0.0.1",
// "TestAgent");

// assertNotNull(response);
// assertEquals("mock_access_token", response.getAccessToken());
// verify(passwordEncoder).matches("secret123", user1.getPassword());
// verify(sessionRepository).save(any(Session.class));
// }

// @Test
// @DisplayName("2. Disambiguates exact email match when input is
// email-formatted")
// void testAdminLogin_exactEmailDisambiguation_succeeds() {
// when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));

// User user1 = buildAdminUser("admin_john", "admin@mark2.in", "secret123");
// User user2 = buildAdminUser("admin@mark2.in", "other@mark2.in", "secret123");

// when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(),
// "admin@mark2.in"))
// .thenReturn(List.of(user1, user2));

// when(passwordEncoder.matches("secret123", "encoded_pass")).thenReturn(true);
// when(moduleRepository.findByNameIgnoreCase("SYSTEM_ADMIN")).thenReturn(Optional.of(systemAdminModule));
// when(jwtService.generateAccessToken(eq("admin_john"),
// any())).thenReturn("mock_access_token");
// when(jwtService.generateRefreshToken(eq("admin_john"),
// eq("000000"))).thenReturn("mock_refresh_token");

// LoginRequest request = new LoginRequest();
// request.setUsername("admin@mark2.in");
// request.setPassword("secret123");

// LoginResponse response = authService.adminLogin(request, "127.0.0.1",
// "TestAgent");

// assertNotNull(response);
// assertEquals("mock_access_token", response.getAccessToken());
// verify(passwordEncoder).matches("secret123", user1.getPassword());
// }

// @Test
// @DisplayName("3. Rejects login safely if multiple candidates cannot be
// disambiguated")
// void testAdminLogin_ambiguousCandidates_throwsBadCredentialsException() {
// when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));

// // Two users with identical email (e.g. dirty data or case collision)
// User user1 = buildAdminUser("Admin1", "admin@mark2.in", "secret123");
// User user2 = buildAdminUser("Admin2", "admin@mark2.in", "secret123");

// when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(),
// "admin@mark2.in"))
// .thenReturn(List.of(user1, user2));

// LoginRequest request = new LoginRequest();
// request.setUsername("admin@mark2.in");
// request.setPassword("secret123");

// BadCredentialsException exception =
// assertThrows(BadCredentialsException.class,
// () -> authService.adminLogin(request, "127.0.0.1", "TestAgent"));

// assertTrue(exception.getMessage().contains("Ambiguous user identity"));
// verify(passwordEncoder, never()).matches(anyString(), anyString());
// }

// @Test
// @DisplayName("4. Rejects user existing only in non-root company")
// void testAdminLogin_nonRootCompanyCandidate_throwsBadCredentialsException() {
// when(companyRepository.findByCompanyCode("000000")).thenReturn(Optional.of(rootCompany));

// // Root company has no user
// when(userRepository.findUsersWithRolesByCompany(rootCompany.getId(),
// "admin@mark2.in"))
// .thenReturn(Collections.emptyList());

// // Global query shows user in another company
// User otherTenantUser = buildAdminUser("tenant_admin", "admin@mark2.in",
// "pass");
// otherTenantUser.setCompany(Company.builder().id(UUID.randomUUID()).companyCode("111111").build());
// when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCaseWithRoles("admin@mark2.in",
// "admin@mark2.in"))
// .thenReturn(List.of(otherTenantUser));

// LoginRequest request = new LoginRequest();
// request.setUsername("admin@mark2.in");
// request.setPassword("secret123");

// BadCredentialsException exception =
// assertThrows(BadCredentialsException.class,
// () -> authService.adminLogin(request, "127.0.0.1", "TestAgent"));

// assertTrue(exception.getMessage().contains("You are not authorized for admin
// login"));
// verify(passwordEncoder, never()).matches(anyString(), anyString());
// }
// }
