package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.LoginRequest;
import com.erp.auth_service.dto.response.LoginResponse;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.InvalidOperationException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.dto.request.RefreshTokenRequest;
import com.erp.auth_service.dto.response.RefreshTokenResponse;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OwnerVsEmployeeLoginTest {

    @Mock
    private OrganizationResolverService organizationResolverService;
    @Mock
    private OrganizationMemberRepository organizationMemberRepository;
    @Mock
    private MemberCompanyAccessRepository memberCompanyAccessRepository;
    @Mock
    private SubscriptionRepository subscriptionRepository;
    @Mock
    private OrganizationModuleRepository organizationModuleRepository;
    @Mock
    private CompanyModuleRepository companyModuleRepository;
    @Mock
    private UserPortalAccessRepository userPortalAccessRepository;
    @Mock
    private ModuleRepository moduleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuthorizationCodeRepository authorizationCodeRepository;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private RefreshTokenRecordRepository refreshTokenRecordRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private JwtDecoder jwtDecoder;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    private Organization org;
    private User ownerUser;
    private User employeeUser;
    private OrganizationMember ownerMember;
    private OrganizationMember employeeMember;
    private Company comp1;
    private Company comp2;
    private Subscription activeSub;

    @BeforeEach
    void setUp() {
        org = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("mohit")
                .displayName("Mohit Org")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        comp1 = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("MOHIT_COMP_1")
                .companyName("Mohit Industries")
                .organization(org)
                .active(true)
                .build();

        comp2 = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("MOHIT_COMP_2")
                .companyName("Mohit Tech")
                .organization(org)
                .active(true)
                .build();

        ownerUser = User.builder()
                .id(UUID.randomUUID())
                .username("mohit_owner")
                .email("mohit@mark2.in")
                .password("encoded_pass")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        employeeUser = User.builder()
                .id(UUID.randomUUID())
                .username("john_doe")
                .email("john@mark2.in")
                .password("encoded_pass")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        ownerMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .user(ownerUser)
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        employeeMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .user(employeeUser)
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        activeSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .status(SubscriptionStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        when(organizationResolverService.resolveByCode("mohit")).thenReturn(org);
        when(passwordEncoder.matches(eq("Secret123!"), anyString())).thenReturn(true);
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(org.getId()))
                .thenReturn(Optional.of(activeSub));
        when(jwtService.generateAccessToken(anyString(), anyMap())).thenReturn("mock.owner.jwt");
        when(jwtService.generateRefreshToken(anyString(), anyString())).thenReturn("mock.owner.refresh");
    }

    @Test
    @DisplayName("Owner login at /erp/o/mohit/login bypasses company selection and redirects to /erp/owner/dashboard")
    void testOwnerLogin_BypassesCompanySelection_RedirectsToOwnerDashboard() {
        when(organizationMemberRepository.findActiveByOrganizationAndEmail(
                eq(org.getId()), eq("mohit@mark2.in"), eq(MembershipStatus.ACTIVE)))
                .thenReturn(Optional.of(ownerMember));

        MemberCompanyAccess mca1 = MemberCompanyAccess.builder().organizationMember(ownerMember).company(comp1).active(true).build();
        MemberCompanyAccess mca2 = MemberCompanyAccess.builder().organizationMember(ownerMember).company(comp2).active(true).build();
        when(memberCompanyAccessRepository.findActiveForMember(ownerMember.getId(), org.getId()))
                .thenReturn(List.of(mca1, mca2));

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("mohit@mark2.in");
        request.setPassword("Secret123!");
        request.setHost("https://www.mark2.in/erp");

        LoginResponse response = authService.organizationLogin(request, "127.0.0.1", "Browser");

        assertNotNull(response);
        assertFalse(Boolean.TRUE.equals(response.getRequiresCompanySelection()), "Owner must never be forced into company selection");
        assertEquals("/erp/owner/dashboard", response.getRedirectUrl(), "Owner must redirect directly to owner dashboard");
        assertEquals("mock.owner.jwt", response.getAccessToken());
        assertNotNull(response.getCompanies());
        assertEquals(2, response.getCompanies().size(), "Owner gets the list of registered companies");
        verify(authorizationCodeRepository).save(argThat(code ->
                "/erp/owner/dashboard".equals(code.getGotoUrl()) && code.getCompany() == null
        ));
    }

    @Test
    @DisplayName("Employee with multiple companies must go through company selection flow")
    void testEmployeeLogin_MultiCompany_RequiresCompanySelection() {
        when(organizationMemberRepository.findActiveByOrganizationAndEmail(
                eq(org.getId()), eq("john@mark2.in"), eq(MembershipStatus.ACTIVE)))
                .thenReturn(Optional.of(employeeMember));

        MemberCompanyAccess mca1 = MemberCompanyAccess.builder().organizationMember(employeeMember).company(comp1).active(true).build();
        MemberCompanyAccess mca2 = MemberCompanyAccess.builder().organizationMember(employeeMember).company(comp2).active(true).build();
        when(memberCompanyAccessRepository.findActiveForMember(employeeMember.getId(), org.getId()))
                .thenReturn(List.of(mca1, mca2));

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("john@mark2.in");
        request.setPassword("Secret123!");
        request.setHost("https://www.mark2.in/erp");

        LoginResponse response = authService.organizationLogin(request, "127.0.0.1", "Browser");

        assertNotNull(response);
        assertTrue(Boolean.TRUE.equals(response.getRequiresCompanySelection()), "Employee with multiple companies requires company selection");
        assertEquals(2, response.getCompanies().size());
        assertNull(response.getAccessToken(), "Tokens should not be issued before employee company selection");
    }

    @Test
    @DisplayName("Employee with single company or explicit companyId logs into company workspace")
    void testEmployeeLogin_SingleCompany_EstablishesCompanySession() {
        when(organizationMemberRepository.findActiveByOrganizationAndEmail(
                eq(org.getId()), eq("john@mark2.in"), eq(MembershipStatus.ACTIVE)))
                .thenReturn(Optional.of(employeeMember));

        MemberCompanyAccess mca1 = MemberCompanyAccess.builder().organizationMember(employeeMember).company(comp1).active(true).build();
        when(memberCompanyAccessRepository.findActiveForMember(employeeMember.getId(), org.getId()))
                .thenReturn(List.of(mca1));
        when(memberCompanyAccessRepository.findActiveCompany(employeeMember.getId(), org.getId(), comp1.getId()))
                .thenReturn(Optional.of(mca1));

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("john@mark2.in");
        request.setPassword("Secret123!");
        request.setHost("https://www.mark2.in/erp");

        LoginResponse response = authService.organizationLogin(request, "127.0.0.1", "Browser");

        assertNotNull(response);
        assertFalse(Boolean.TRUE.equals(response.getRequiresCompanySelection()));
        assertNotNull(response.getRedirectUrl());
        assertTrue(response.getRedirectUrl().contains("/auth/callback?code="));
        verify(authorizationCodeRepository).save(argThat(code ->
                code.getCompany() != null && code.getCompany().getId().equals(comp1.getId())
        ));
    }

    @Test
    @DisplayName("Invalid credentials reject login attempt with BadCredentialsException")
    void testInvalidCredentials_ThrowsBadCredentialsException() {
        when(organizationMemberRepository.findActiveByOrganizationAndEmail(
                eq(org.getId()), eq("mohit@mark2.in"), eq(MembershipStatus.ACTIVE)))
                .thenReturn(Optional.of(ownerMember));
        when(passwordEncoder.matches(eq("WrongPassword"), anyString())).thenReturn(false);

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("mohit@mark2.in");
        request.setPassword("WrongPassword");

        assertThrows(BadCredentialsException.class, () ->
                authService.organizationLogin(request, "127.0.0.1", "Browser"));
    }

    @Test
    @DisplayName("Blocked organization access rejects owner login attempt")
    void testBlockedOrganization_ThrowsInvalidOperationException() {
        when(organizationMemberRepository.findActiveByOrganizationAndEmail(
                eq(org.getId()), eq("mohit@mark2.in"), eq(MembershipStatus.ACTIVE)))
                .thenReturn(Optional.of(ownerMember));

        Subscription blockedSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .status(SubscriptionStatus.EXPIRED)
                .accessMode(AccessMode.BLOCKED)
                .build();
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(org.getId()))
                .thenReturn(Optional.of(blockedSub));

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("mohit@mark2.in");
        request.setPassword("Secret123!");

        assertThrows(InvalidOperationException.class, () ->
                authService.organizationLogin(request, "127.0.0.1", "Browser"));
    }

    @Test
    @DisplayName("Owner token refresh succeeds with null company and maintains owner claims")
    void testOwnerTokenRefresh_RotatesSuccessfullyWithoutCompany() {
        Session ownerSession = Session.builder()
                .id(UUID.randomUUID())
                .user(ownerUser)
                .company(null)
                .organization(org)
                .module(null)
                .accessToken("old.owner.access")
                .accessTokenValidTill(LocalDateTime.now().plusMinutes(15))
                .refreshTokenValidTill(LocalDateTime.now().plusDays(7))
                .build();

        RefreshTokenRecord record = RefreshTokenRecord.builder()
                .id(UUID.randomUUID())
                .session(ownerSession)
                .tokenHash("mock-hash")
                .familyId(UUID.randomUUID())
                .issuedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        when(refreshTokenRecordRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(record));
        when(jwtDecoder.isTokenExpired(anyString())).thenReturn(false);
        when(userRepository.findByIdWithRoles(ownerUser.getId())).thenReturn(Optional.of(ownerUser));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                eq(org.getId()), eq(ownerUser.getId()), eq(MembershipStatus.ACTIVE)))
                .thenReturn(Optional.of(ownerMember));
        when(jwtService.generateAccessToken(eq(ownerUser.getUsername()), anyMap()))
                .thenReturn("new.owner.jwt");
        when(jwtService.generateRefreshToken(eq(ownerUser.getUsername()), eq("mohit")))
                .thenReturn("new.owner.refresh");

        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("valid.raw.refresh");

        RefreshTokenResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new.owner.jwt", response.getAccessToken());
        assertEquals("new.owner.refresh", response.getRefreshToken());
        verify(jwtService).generateRefreshToken(eq(ownerUser.getUsername()), eq("mohit"));
        verify(sessionRepository).save(argThat(s -> s.getCompany() == null && s.getOrganization().equals(org)));
    }
}

