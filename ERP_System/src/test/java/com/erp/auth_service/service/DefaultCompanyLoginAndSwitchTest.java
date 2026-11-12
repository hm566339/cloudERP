package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.LoginRequest;
import com.erp.auth_service.dto.request.RefreshTokenRequest;
import com.erp.auth_service.dto.response.LoginResponse;
import com.erp.auth_service.dto.response.RefreshTokenResponse;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.utility.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DefaultCompanyLoginAndSwitchTest {

        @Mock
        private UserRepository userRepository;
        @Mock
        private ModuleRepository moduleRepository;
        @Mock
        private SessionRepository sessionRepository;
        @Mock
        private AuthorizationCodeRepository authorizationCodeRepository;
        @Mock
        private PasswordEncoder passwordEncoder;
        @Mock
        private JwtService jwtService;
        @Mock
        private JwtDecoder jwtDecoder;
        @Mock
        private UserPortalAccessRepository userPortalAccessRepository;
        @Mock
        private UserRoleRepository userRoleRepository;
        @Mock
        private CompanyRepository companyRepository;
        @Mock
        private CompanyModuleRepository companyModuleRepository;
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

        private Organization apexOrg;
        private Company apexIndia;
        private Company techNova;
        private Company unauthorizedThird;
        private User mohitUser;
        private OrganizationMember mohitMember;
        private MemberCompanyAccess accessApex;
        private MemberCompanyAccess accessTechNova;
        private Subscription subscription;

        @BeforeEach
        void setUp() {
                apexOrg = Organization.builder()
                                .id(UUID.randomUUID())
                                .organizationCode("apex-group")
                                .displayName("Apex Group")
                                .legalName("Apex Group")
                                .status(OrganizationStatus.ACTIVE)
                                .build();

                apexIndia = Company.builder()
                                .id(UUID.randomUUID())
                                .companyCode("APEXIN")
                                .companyName("Apex India Pvt Ltd")
                                .organization(apexOrg)
                                .active(true)
                                .build();

                techNova = Company.builder()
                                .id(UUID.randomUUID())
                                .companyCode("TECHNOVA")
                                .companyName("TechNova Solutions")
                                .organization(apexOrg)
                                .active(true)
                                .build();

                unauthorizedThird = Company.builder()
                                .id(UUID.randomUUID())
                                .companyCode("SECRETCO")
                                .companyName("Secret Division")
                                .organization(apexOrg)
                                .active(true)
                                .build();

                mohitUser = User.builder()
                                .id(UUID.randomUUID())
                                .username("harshomohit13")
                                .email("harshomohit13@gmail.com")
                                .fullName("Mohit Kumar")
                                .password("encoded_pw")
                                .accountStatus(AccountStatus.ACTIVE)
                                .emailStatus(Status.VERIFIED)
                                .build();

                mohitMember = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(apexOrg)
                                .user(mohitUser)
                                .memberType(MemberType.MEMBER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();

                accessApex = MemberCompanyAccess.builder()
                                .id(UUID.randomUUID())
                                .organizationMember(mohitMember)
                                .organization(apexOrg)
                                .company(apexIndia)
                                .active(true)
                                .build();

                accessTechNova = MemberCompanyAccess.builder()
                                .id(UUID.randomUUID())
                                .organizationMember(mohitMember)
                                .organization(apexOrg)
                                .company(techNova)
                                .active(true)
                                .build();

                subscription = Subscription.builder()
                                .id(UUID.randomUUID())
                                .organization(apexOrg)
                                .status(SubscriptionStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();

                when(organizationResolverService.resolveByCode("apex-group")).thenReturn(apexOrg);
                when(organizationMemberRepository.findActiveByOrganizationAndEmail(
                                apexOrg.getId(), "harshomohit13@gmail.com", MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(mohitMember));
                when(passwordEncoder.matches("Mohit@123", "encoded_pw")).thenReturn(true);
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(apexOrg.getId()))
                                .thenReturn(Optional.of(subscription));
                when(memberCompanyAccessRepository.findActiveForMember(mohitMember.getId(), apexOrg.getId()))
                                .thenReturn(List.of(accessApex, accessTechNova));
                when(memberCompanyAccessRepository.findActiveCompany(mohitMember.getId(), apexOrg.getId(),
                                apexIndia.getId()))
                                .thenReturn(Optional.of(accessApex));
                when(memberCompanyAccessRepository.findActiveCompany(mohitMember.getId(), apexOrg.getId(),
                                techNova.getId()))
                                .thenReturn(Optional.of(accessTechNova));

                when(jwtService.getAccessTokenExpirationMinutes()).thenReturn(30L);
                when(jwtService.generateAccessToken(anyString(), anyMap(), anyLong()))
                                .thenAnswer(inv -> {
                                        Map<String, Object> claims = inv.getArgument(1);
                                        return "jwt-" + claims.get("companyId");
                                });
                when(jwtService.generateRefreshToken(anyString(), anyString()))
                                .thenAnswer(inv -> "refresh-" + inv.getArgument(1) + "-" + UUID.randomUUID());
                when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> {
                        Session s = inv.getArgument(0);
                        if (s.getId() == null)
                                s.setId(UUID.randomUUID());
                        return s;
                });
        }

        private LoginRequest loginReq() {
                LoginRequest req = new LoginRequest();
                req.setOrganizationCode("apex-group");
                req.setUsername("harshomohit13@gmail.com");
                req.setPassword("Mohit@123");
                return req;
        }

        @Test
        @DisplayName("Multi-company member with valid default company auto-logs in without selection screen")
        void testDefaultCompanyAutoLogin() {
                mohitMember.setDefaultCompany(apexIndia);

                LoginResponse resp = authService.login(loginReq(), "127.0.0.1", "JUnit");

                assertFalse(Boolean.TRUE.equals(resp.getRequiresCompanySelection()));
                assertEquals(apexIndia.getId(), resp.getDefaultCompanyId());
                assertEquals("Apex India Pvt Ltd", resp.getDefaultCompanyName());
                assertEquals(2, resp.getCompanies().size());
                assertEquals("jwt-" + apexIndia.getId(), resp.getAccessToken());
                assertNotNull(resp.getRedirectUrl());

                ArgumentCaptor<AuthorizationCode> codeCaptor = ArgumentCaptor.forClass(AuthorizationCode.class);
                verify(authorizationCodeRepository).save(codeCaptor.capture());
                assertEquals(apexIndia.getId(), codeCaptor.getValue().getCompany().getId());

                // Now change default company to TechNova Solutions -> subsequent login
                // auto-opens TechNova
                mohitMember.setDefaultCompany(techNova);
                LoginResponse resp2 = authService.login(loginReq(), "127.0.0.1", "JUnit");
                assertFalse(Boolean.TRUE.equals(resp2.getRequiresCompanySelection()));
                assertEquals(techNova.getId(), resp2.getDefaultCompanyId());
                assertEquals("jwt-" + techNova.getId(), resp2.getAccessToken());
        }

        @Test
        @DisplayName("Member without default company prompts company selection with authorized companies only")
        void testNoDefaultCompanyPromptsSelection() {
                mohitMember.setDefaultCompany(null);

                LoginResponse resp = authService.login(loginReq(), "127.0.0.1", "JUnit");

                assertTrue(Boolean.TRUE.equals(resp.getRequiresCompanySelection()));
                assertNull(resp.getAccessToken());
                assertEquals(2, resp.getCompanies().size());
                assertTrue(resp.getCompanies().stream().noneMatch(c -> c.getId().equals(unauthorizedThird.getId())));
        }

        @Test
        @DisplayName("Fallback when default company is inactive or revoked never grants unauthorized access")
        void testFallbackWhenDefaultCompanyInactiveOrRevoked() {
                // Case A: Inactive default company -> falls back to active selection
                apexIndia.setActive(false);
                mohitMember.setDefaultCompany(apexIndia);
                Company gamma = Company.builder().id(UUID.randomUUID()).companyName("Gamma Corp").companyCode("GAMMA")
                                .organization(apexOrg).active(true).build();
                MemberCompanyAccess accessGamma = MemberCompanyAccess.builder()
                                .organizationMember(mohitMember).organization(apexOrg).company(gamma).active(true)
                                .build();
                when(memberCompanyAccessRepository.findActiveForMember(mohitMember.getId(), apexOrg.getId()))
                                .thenReturn(List.of(accessTechNova, accessGamma));

                LoginResponse inactiveFallback = authService.login(loginReq(), "127.0.0.1", "JUnit");
                assertTrue(Boolean.TRUE.equals(inactiveFallback.getRequiresCompanySelection()));
                assertEquals(2, inactiveFallback.getCompanies().size());
                assertTrue(inactiveFallback.getCompanies().stream()
                                .noneMatch(c -> c.getId().equals(apexIndia.getId())));

                // Case B: Default company access revoked (stale pointer remains) -> never logs
                // into revoked company
                apexIndia.setActive(true);
                when(memberCompanyAccessRepository.findActiveCompany(mohitMember.getId(), apexOrg.getId(),
                                apexIndia.getId()))
                                .thenReturn(Optional.empty());
                LoginResponse revokedFallback = authService.login(loginReq(), "127.0.0.1", "JUnit");
                assertTrue(Boolean.TRUE.equals(revokedFallback.getRequiresCompanySelection()));
                assertTrue(revokedFallback.getCompanies().stream().noneMatch(c -> c.getId().equals(apexIndia.getId())));
        }

        @Test
        @DisplayName("Multi-organization isolation: default company is scoped per organization_member")
        void testMultiOrgDefaultCompanyIsolation() {
                Organization secondOrg = Organization.builder()
                                .id(UUID.randomUUID()).organizationCode("beta-group").displayName("Beta Group").build();
                Company betaCompany = Company.builder()
                                .id(UUID.randomUUID()).companyCode("BETA1").companyName("Beta One")
                                .organization(secondOrg).active(true).build();
                OrganizationMember secondOrgMember = OrganizationMember.builder()
                                .id(UUID.randomUUID()).organization(secondOrg).user(mohitUser)
                                .memberType(MemberType.MEMBER).membershipStatus(MembershipStatus.ACTIVE)
                                .defaultCompany(betaCompany).build();
                MemberCompanyAccess betaAccess = MemberCompanyAccess.builder()
                                .id(UUID.randomUUID()).organizationMember(secondOrgMember).organization(secondOrg)
                                .company(betaCompany).active(true).build();

                // Org 1 uses Apex India
                mohitMember.setDefaultCompany(apexIndia);
                LoginResponse org1Resp = authService.login(loginReq(), "127.0.0.1", "JUnit");
                assertEquals("jwt-" + apexIndia.getId(), org1Resp.getAccessToken());

                // Org 2 uses Beta One
                when(organizationResolverService.resolveByCode("beta-group")).thenReturn(secondOrg);
                when(organizationMemberRepository.findActiveByOrganizationAndEmail(
                                secondOrg.getId(), "harshomohit13@gmail.com", MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(secondOrgMember));
                when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(secondOrg.getId()))
                                .thenReturn(Optional.of(Subscription.builder().organization(secondOrg)
                                                .status(SubscriptionStatus.ACTIVE).accessMode(AccessMode.FULL)
                                                .build()));
                when(memberCompanyAccessRepository.findActiveForMember(secondOrgMember.getId(), secondOrg.getId()))
                                .thenReturn(List.of(betaAccess));
                when(memberCompanyAccessRepository.findActiveCompany(secondOrgMember.getId(), secondOrg.getId(),
                                betaCompany.getId()))
                                .thenReturn(Optional.of(betaAccess));

                LoginRequest org2Req = loginReq();
                org2Req.setOrganizationCode("beta-group");
                LoginResponse org2Resp = authService.login(org2Req, "127.0.0.1", "JUnit");
                assertEquals("jwt-" + betaCompany.getId(), org2Resp.getAccessToken());
        }

        @Test
        @DisplayName("Company switching updates session, rotates JWT & refresh token, blocks unauthorized target, and supports post-switch token refresh")
        void testSwitchCompanyAndTokenRotation() throws Exception {
                UUID familyId = UUID.randomUUID();
                UUID sessionId = UUID.randomUUID();
                String initialAccess = "jwt-" + apexIndia.getId();
                String initialRefresh = "refresh-APEXIN-1";

                Session activeSession = Session.builder()
                                .id(sessionId)
                                .user(mohitUser)
                                .organization(apexOrg)
                                .company(apexIndia)
                                .accessToken(initialAccess)
                                .refreshToken(initialRefresh)
                                .accessTokenValidTill(LocalDateTime.now().plusMinutes(25))
                                .refreshTokenValidTill(LocalDateTime.now().plusDays(7))
                                .build();

                RefreshTokenRecord initialRtRecord = RefreshTokenRecord.builder()
                                .id(UUID.randomUUID())
                                .session(activeSession)
                                .tokenHash(sha256(initialRefresh))
                                .familyId(familyId)
                                .issuedAt(LocalDateTime.now().minusMinutes(1))
                                .expiresAt(LocalDateTime.now().plusDays(7))
                                .build();

                when(sessionRepository.findByAccessToken(initialAccess)).thenReturn(Optional.of(activeSession));
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                                apexOrg.getId(), mohitUser.getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(mohitMember));
                when(companyRepository.findById(techNova.getId())).thenReturn(Optional.of(techNova));
                when(companyRepository.findById(unauthorizedThird.getId())).thenReturn(Optional.of(unauthorizedThird));
                when(memberCompanyAccessRepository.findActiveCompany(
                                mohitMember.getId(), apexOrg.getId(), unauthorizedThird.getId()))
                                .thenReturn(Optional.empty());
                when(refreshTokenRecordRepository.findByTokenHash(sha256(initialRefresh)))
                                .thenReturn(Optional.of(initialRtRecord));

                // 1. Unauthorized company switch is blocked with 403 Forbidden
                assertThrows(ForbiddenException.class,
                                () -> authService.switchCompany(initialAccess, unauthorizedThird.getId(), "127.0.0.1",
                                                "JUnit"));

                // 2. Authorized switch to TechNova rotates JWT + refresh token and updates
                // session.company
                LoginResponse switchResp = authService.switchCompany(initialAccess, techNova.getId(), "127.0.0.1",
                                "JUnit");
                assertEquals("jwt-" + techNova.getId(), switchResp.getAccessToken());
                assertNotEquals(initialRefresh, switchResp.getRefreshToken());
                assertEquals(techNova.getId(), activeSession.getCompany().getId());
                assertNotNull(initialRtRecord.getUsedAt());

                ArgumentCaptor<RefreshTokenRecord> savedRtCaptor = ArgumentCaptor.forClass(RefreshTokenRecord.class);
                verify(refreshTokenRecordRepository, atLeast(2)).save(savedRtCaptor.capture());
                RefreshTokenRecord rotatedRtRecord = savedRtCaptor.getAllValues().stream()
                                .filter(r -> r.getUsedAt() == null)
                                .findFirst()
                                .orElseThrow();
                assertEquals(familyId, rotatedRtRecord.getFamilyId());

                // 3. Refresh token after switch stays scoped to TechNova Solutions
                when(jwtDecoder.isTokenExpired(switchResp.getRefreshToken())).thenReturn(false);
                when(refreshTokenRecordRepository.findByTokenHash(rotatedRtRecord.getTokenHash()))
                                .thenReturn(Optional.of(rotatedRtRecord));
                when(userRepository.findByIdWithRoles(mohitUser.getId())).thenReturn(Optional.of(mohitUser));

                RefreshTokenRequest refreshReq = new RefreshTokenRequest();
                refreshReq.setRefreshToken(switchResp.getRefreshToken());
                RefreshTokenResponse refreshed = authService.refreshToken(refreshReq);
                assertEquals("jwt-" + techNova.getId(), refreshed.getAccessToken());
                assertEquals(techNova.getId(), activeSession.getCompany().getId());
        }

        private static String sha256(String value) throws Exception {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
                return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        }
}