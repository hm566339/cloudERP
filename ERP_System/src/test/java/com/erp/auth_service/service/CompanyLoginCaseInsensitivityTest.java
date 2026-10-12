package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.LoginRequest;
import com.erp.auth_service.dto.response.CompanyResponse;
import com.erp.auth_service.dto.response.LoginResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.AuthorizationCodeMapper;
import com.erp.auth_service.mapper.CompanyMapper;
import com.erp.auth_service.mapper.SsoSessionMapper;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.service.impl.CompanyServiceImpl;
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
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyLoginCaseInsensitivityTest {

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
    @Mock
    private CompanyMapper companyMapper;
    @Mock
    private RestClient.Builder restClientBuilder;
    @Mock
    private AuthorizationService authorizationService;

    @InjectMocks
    private AuthServiceImpl authService;

    private CompanyServiceImpl companyService;

    private Company mohitCompany;
    private Company inactiveCompany;
    private User testUser;
    private Module testModule;
    private CompanyModule testCompanyModule;
    private UserPortalAccess testPortalAccess;

    @BeforeEach
    void setUp() {
        companyService = new CompanyServiceImpl(
                companyRepository,
                companyMapper,
                restClientBuilder,
                null,
                authorizationService,
                null,
                subscriptionRepository,
                organizationMemberRepository,
                memberCompanyAccessRepository,
                roleRepository,
                userRoleRepository
        );

        mohitCompany = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("MOHIT")
                .companyName("Mohit Industries")
                .active(true)
                .build();

        inactiveCompany = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("MOHIT")
                .companyName("Mohit Industries")
                .active(false)
                .build();

        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("john_mohit")
                .email("john@mohit.in")
                .password("$2a$10$encodedpassword")
                .company(mohitCompany)
                .accountStatus(AccountStatus.ACTIVE)
                .emailStatus(Status.VERIFIED)
                .failedLoginCount(0)
                .build();

        testModule = Module.builder()
                .id(UUID.randomUUID())
                .name("ACCOUNT")
                .host("https://www.mark2.in/erp/accounts")
                .moduleStatus(true)
                .build();

        testCompanyModule = CompanyModule.builder()
                .id(UUID.randomUUID())
                .company(mohitCompany)
                .module(testModule)
                .active(true)
                .build();

        testPortalAccess = UserPortalAccess.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .companyModule(testCompanyModule)
                .status(true)
                .build();
    }

    private void stubSuccessfulUserAuth() {
        when(userRepository.findUsersWithRolesByCompany(eq(mohitCompany.getId()), eq("john_mohit")))
                .thenReturn(List.of(testUser));
        when(passwordEncoder.matches("Password123@", testUser.getPassword()))
                .thenReturn(true);
        when(sessionRepository.countUserActiveSessions(eq(testUser.getId()), any(LocalDateTime.class)))
                .thenReturn(0);
        when(userPortalAccessRepository.findFirstByUser_IdAndStatusTrueOrderByCreatedAtAsc(testUser.getId()))
                .thenReturn(Optional.of(testPortalAccess));
        when(jwtService.generateAccessToken(eq("john_mohit"), any()))
                .thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(eq("john_mohit"), eq("MOHIT")))
                .thenReturn("mock-refresh-token");
    }

    @Test
    @DisplayName("Login with lowercase company code 'mohit' successfully resolves company 'MOHIT'")
    void testLogin_LowercaseCompanyCode_ResolvesMohitCompany_Success() {
        when(companyRepository.findByCompanyCode("mohit"))
                .thenReturn(Optional.of(mohitCompany));
        stubSuccessfulUserAuth();

        LoginRequest req = new LoginRequest();
        req.setCompanyCode("mohit");
        req.setUsername("john_mohit");
        req.setPassword("Password123@");

        LoginResponse resp = authService.login(req, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(resp);
        assertEquals("mock-access-token", resp.getAccessToken());
        assertEquals("mock-refresh-token", resp.getRefreshToken());
        verify(companyRepository).findByCompanyCode("mohit");
    }

    @Test
    @DisplayName("Login with uppercase company code 'MOHIT' successfully resolves company 'MOHIT'")
    void testLogin_UppercaseCompanyCode_ResolvesMohitCompany_Success() {
        when(companyRepository.findByCompanyCode("MOHIT"))
                .thenReturn(Optional.of(mohitCompany));
        stubSuccessfulUserAuth();

        LoginRequest req = new LoginRequest();
        req.setCompanyCode("MOHIT");
        req.setUsername("john_mohit");
        req.setPassword("Password123@");

        LoginResponse resp = authService.login(req, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(resp);
        assertEquals("mock-access-token", resp.getAccessToken());
        assertEquals("mock-refresh-token", resp.getRefreshToken());
        verify(companyRepository).findByCompanyCode("MOHIT");
    }

    @Test
    @DisplayName("Login with mixed-case company code 'Mohit' with surrounding spaces successfully resolves company 'MOHIT'")
    void testLogin_MixedCaseCompanyCode_ResolvesMohitCompany_Success() {
        when(companyRepository.findByCompanyCode("Mohit"))
                .thenReturn(Optional.of(mohitCompany));
        stubSuccessfulUserAuth();

        LoginRequest req = new LoginRequest();
        req.setCompanyCode("  Mohit  ");
        req.setUsername("john_mohit");
        req.setPassword("Password123@");

        LoginResponse resp = authService.login(req, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(resp);
        assertEquals("mock-access-token", resp.getAccessToken());
        verify(companyRepository).findByCompanyCode("Mohit");
    }

    @Test
    @DisplayName("Login with inactive company returns 400 BadRequestException with 'Company is inactive'")
    void testLogin_InactiveCompany_ThrowsBadRequestException() {
        when(companyRepository.findByCompanyCode("mohit"))
                .thenReturn(Optional.of(inactiveCompany));

        LoginRequest req = new LoginRequest();
        req.setCompanyCode("mohit");
        req.setUsername("john_mohit");
        req.setPassword("Password123@");

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> authService.login(req, "127.0.0.1", "Mozilla/5.0")
        );

        assertEquals("Company is inactive", ex.getMessage());
        verify(userRepository, never()).findUsersWithRolesByCompany(any(), any());
    }

    @Test
    @DisplayName("Login with unknown company code returns 404 ResourceNotFoundException with 'Company not found'")
    void testLogin_UnknownCompanyCode_ThrowsResourceNotFoundException() {
        when(companyRepository.findByCompanyCode("unknown_co"))
                .thenReturn(Optional.empty());

        LoginRequest req = new LoginRequest();
        req.setCompanyCode("unknown_co");
        req.setUsername("john_mohit");
        req.setPassword("Password123@");

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> authService.login(req, "127.0.0.1", "Mozilla/5.0")
        );

        assertEquals("Company not found", ex.getMessage());
    }

    @Test
    @DisplayName("Login with blank company code returns 404 ResourceNotFoundException with 'Company not found'")
    void testLogin_BlankCompanyCode_ThrowsResourceNotFoundException() {
        LoginRequest req = new LoginRequest();
        req.setCompanyCode("   ");
        req.setUsername("john_mohit");
        req.setPassword("Password123@");

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> authService.login(req, "127.0.0.1", "Mozilla/5.0")
        );

        assertEquals("Company not found", ex.getMessage());
        verify(companyRepository, never()).findByCompanyCode(anyString());
    }

    @Test
    @DisplayName("CompanyService.getCompanyByCode trims and resolves company code case-insensitively")
    void testGetCompanyByCode_CaseInsensitive_Success() {
        CompanyResponse mappedResponse = CompanyResponse.builder()
                .id(mohitCompany.getId())
                .companyCode("MOHIT")
                .companyName("Mohit Industries")
                .build();

        when(companyRepository.findByCompanyCode("mohit"))
                .thenReturn(Optional.of(mohitCompany));
        when(companyMapper.toCompanyResponse(mohitCompany))
                .thenReturn(mappedResponse);

        CompanyResponse resp = companyService.getCompanyByCode("  mohit  ");

        assertNotNull(resp);
        assertEquals("MOHIT", resp.getCompanyCode());
        verify(companyRepository).findByCompanyCode("mohit");
    }

    @Test
    @DisplayName("CompanyService.verifyCompany resolves mixed-case company code successfully")
    void testVerifyCompany_MixedCase_Success() {
        CompanyResponse mappedResponse = CompanyResponse.builder()
                .id(mohitCompany.getId())
                .companyCode("MOHIT")
                .companyName("Mohit Industries")
                .build();

        when(companyRepository.findByCompanyCode("Mohit"))
                .thenReturn(Optional.of(mohitCompany));
        when(companyMapper.toCompanyResponse(mohitCompany))
                .thenReturn(mappedResponse);

        CompanyResponse resp = companyService.verifyCompany(null, "Mohit");

        assertNotNull(resp);
        assertEquals("MOHIT", resp.getCompanyCode());
        verify(companyRepository).findByCompanyCode("Mohit");
    }

    @Test
    @DisplayName("Direct generateAuthorizationCode with inactive company throws BadRequestException")
    void testGenerateAuthorizationCode_InactiveCompany_ThrowsBadRequestException() {
        when(companyRepository.findByCompanyCode("mohit"))
                .thenReturn(Optional.of(inactiveCompany));

        LoginRequest req = new LoginRequest();
        req.setCompanyCode("mohit");
        req.setUsername("john_mohit");

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> authService.generateAuthorizationCode(req)
        );

        assertEquals("Company is inactive", ex.getMessage());
    }
}
