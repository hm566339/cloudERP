package com.erp.auth_service.service;

import com.erp.auth_service.dto.response.TokenResponse;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.TokenExpiredException;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TokenExchangeTest {

    @Mock
    private AuthorizationCodeRepository authorizationCodeRepository;
    @Mock
    private ModuleRepository moduleRepository;
    @Mock
    private OrganizationMemberRepository organizationMemberRepository;
    @Mock
    private MemberCompanyAccessRepository memberCompanyAccessRepository;
    @Mock
    private OrganizationModuleRepository organizationModuleRepository;
    @Mock
    private CompanyModuleRepository companyModuleRepository;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private RefreshTokenRecordRepository refreshTokenRecordRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    private User user;
    private Organization organization;
    private Company company;
    private Module accountModule;
    private AuthorizationCode authCode;

    @BeforeEach
    void setUp() {
        organization = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("mohit")
                .displayName("Mohit Org")
                .legalName("Mohit Technologies")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        company = Company.builder()
                .id(UUID.randomUUID())
                .companyName("Mohit Tech Ltd")
                .companyCode("MOHIT-TECH")
                .organization(organization)
                .build();

        user = User.builder()
                .id(UUID.randomUUID())
                .username("admin@mark2.in")
                .email("admin@mark2.in")
                .build();

        accountModule = Module.builder()
                .id(UUID.randomUUID())
                .name("ACCOUNT")
                .clientId(UUID.randomUUID())
                .clientSecret("secure-secret-12345")
                .moduleStatus(true)
                .host("https://www.mark2.in/erp/accounts")
                .build();

        authCode = AuthorizationCode.builder()
                .code("e77cb68f-d103-481c-8ea7-7ce923e725e6")
                .used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .user(user)
                .company(company)
                .organization(organization)
                .module(accountModule)
                .build();

        when(authorizationCodeRepository.findByCode("e77cb68f-d103-481c-8ea7-7ce923e725e6"))
                .thenReturn(Optional.of(authCode));

        OrganizationMember member = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(user)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                organization.getId(), user.getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(member));

        MemberCompanyAccess companyAccess = MemberCompanyAccess.builder()
                .id(UUID.randomUUID())
                .organizationMember(member)
                .organization(organization)
                .company(company)
                .build();
        when(memberCompanyAccessRepository.findActiveCompany(member.getId(), organization.getId(), company.getId()))
                .thenReturn(Optional.of(companyAccess));

        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(
                organization.getId(), accountModule.getId()))
                .thenReturn(true);

        CompanyModule companyModule = CompanyModule.builder()
                .id(UUID.randomUUID())
                .company(company)
                .module(accountModule)
                .active(true)
                .build();
        when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(
                company.getId(), accountModule.getId()))
                .thenReturn(Optional.of(companyModule));

        when(jwtService.generateAccessToken(any(), any())).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(any(), any())).thenReturn("mock-refresh-token");
    }

    @Test
    @DisplayName("Exchange code with exact matching clientId and clientSecret succeeds")
    void testExchangeCode_Success_WithExactCredentials() {
        when(moduleRepository.findByClientId(accountModule.getClientId())).thenReturn(Optional.of(accountModule));

        TokenResponse response = authService.exchangeCodeForToken(
                "e77cb68f-d103-481c-8ea7-7ce923e725e6",
                accountModule.getClientId().toString(),
                "secure-secret-12345");

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertTrue(authCode.getUsed());
    }

    @Test
    @DisplayName("Exchange code with placeholder clientId from .env succeeds using code-bound module")
    void testExchangeCode_Success_WithPlaceholderClientId() {
        TokenResponse response = authService.exchangeCodeForToken(
                "e77cb68f-d103-481c-8ea7-7ce923e725e6",
                "your_account_sso_client_id_uuid",
                "$2a$10$your_bcrypt_hashed_or_plain_client_secret");

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertTrue(authCode.getUsed());
    }

    @Test
    @DisplayName("Exchange code with null or blank clientId succeeds using code-bound module")
    void testExchangeCode_Success_WithNullClientId() {
        TokenResponse response = authService.exchangeCodeForToken(
                "e77cb68f-d103-481c-8ea7-7ce923e725e6",
                (String) null,
                null);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertTrue(authCode.getUsed());
    }

    @Test
    @DisplayName("Exchange code with module name ACCOUNT succeeds")
    void testExchangeCode_Success_WithModuleName() {
        TokenResponse response = authService.exchangeCodeForToken(
                "e77cb68f-d103-481c-8ea7-7ce923e725e6",
                "ACCOUNT",
                null);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertTrue(authCode.getUsed());
    }

    @Test
    @DisplayName("Exchange code fails when code is already used")
    void testExchangeCode_Fails_WhenAlreadyUsed() {
        authCode.setUsed(true);

        assertThrows(BadCredentialsException.class, () ->
                authService.exchangeCodeForToken(
                        "e77cb68f-d103-481c-8ea7-7ce923e725e6",
                        "ACCOUNT",
                        null));
    }

    @Test
    @DisplayName("Exchange code fails when code is expired")
    void testExchangeCode_Fails_WhenExpired() {
        authCode.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        assertThrows(TokenExpiredException.class, () ->
                authService.exchangeCodeForToken(
                        "e77cb68f-d103-481c-8ea7-7ce923e725e6",
                        "ACCOUNT",
                        null));
    }

    @Test
    @DisplayName("Exchange code fails when clientId belongs to another module (mismatch)")
    void testExchangeCode_Fails_WhenModuleMismatch() {
        Module otherModule = Module.builder()
                .id(UUID.randomUUID())
                .name("INVENTORY")
                .clientId(UUID.randomUUID())
                .build();
        when(moduleRepository.findByClientId(otherModule.getClientId())).thenReturn(Optional.of(otherModule));

        assertThrows(BadCredentialsException.class, () ->
                authService.exchangeCodeForToken(
                        "e77cb68f-d103-481c-8ea7-7ce923e725e6",
                        otherModule.getClientId().toString(),
                        null));
    }
}
