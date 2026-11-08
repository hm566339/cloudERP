package com.erp.auth_service.security;

import com.erp.auth_service.dto.request.RefreshTokenRequest;
import com.erp.auth_service.dto.response.RefreshTokenResponse;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.AuthorizationCodeMapper;
import com.erp.auth_service.mapper.SsoSessionMapper;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.OrganizationResolverService;
import com.erp.auth_service.service.PermissionService;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenReplayAndGraceSecurityTest {

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

        private UUID userId;
        private UUID orgId;
        private UUID familyId;
        private UUID sessionId;
        private UUID clientId;

        private User user;
        private Organization organization;
        private Session session;
        private Module module;

        private String rawRefreshToken = "test.raw.refresh.token.123";
        private String hashedToken;

        private String hashRefreshToken(String token) {
                try {
                        MessageDigest digest = MessageDigest.getInstance("SHA-256");
                        byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
                        return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
                } catch (Exception e) {
                        throw new RuntimeException(e);
                }
        }

        @BeforeEach
        void setUp() {
                userId = UUID.randomUUID();
                orgId = UUID.randomUUID();
                familyId = UUID.randomUUID();
                sessionId = UUID.randomUUID();
                clientId = UUID.randomUUID();

                hashedToken = hashRefreshToken(rawRefreshToken);

                organization = Organization.builder()
                                .id(orgId)
                                .organizationCode("apex-global")
                                .displayName("Apex Global")
                                .status(OrganizationStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();

                user = User.builder()
                                .id(userId)
                                .username("apex_owner")
                                .email("owner@apex.com")
                                .accountStatus(AccountStatus.ACTIVE)
                                .build();

                module = Module.builder()
                                .id(UUID.randomUUID())
                                .name("ERP_WORKSPACE")
                                .clientId(clientId)
                                .build();

                session = Session.builder()
                                .id(sessionId)
                                .user(user)
                                .organization(organization)
                                .company(null)
                                .module(module)
                                .accessToken("active.access.token")
                                .refreshToken("active.rotated.refresh.token")
                                .accessTokenValidTill(LocalDateTime.now().plusMinutes(15))
                                .refreshTokenValidTill(LocalDateTime.now().plusDays(7))
                                .build();
        }

        @Test
        @DisplayName("Legitimate Concurrency: Replay within 30s grace window from same client returns active token pair idempotently")
        void testConcurrentRefreshWithinGraceWindowReturnsActiveTokens() {
                LocalDateTime now = LocalDateTime.now();

                RefreshTokenRecord usedRecord = RefreshTokenRecord.builder()
                                .id(UUID.randomUUID())
                                .tokenHash(hashedToken)
                                .familyId(familyId)
                                .session(session)
                                .issuedAt(now.minusMinutes(10))
                                .usedAt(now.minusSeconds(5)) // Used 5 seconds ago (< 30s grace window)
                                .expiresAt(now.plusDays(7))
                                .revokedAt(null)
                                .build();

                when(refreshTokenRecordRepository.findByTokenHash(hashedToken))
                                .thenReturn(Optional.of(usedRecord));

                RefreshTokenRequest request = new RefreshTokenRequest(rawRefreshToken, clientId);

                RefreshTokenResponse response = authService.refreshToken(request);

                assertNotNull(response);
                assertEquals("active.access.token", response.getAccessToken());
                assertEquals("active.rotated.refresh.token", response.getRefreshToken());

                // Verify family was NOT revoked
                verify(refreshTokenRecordRepository, never()).findAllByFamilyId(any());
        }

        @Test
        @DisplayName("Malicious Replay: Used token replayed outside 30s grace window triggers family revocation and throws 401 BadCredentials")
        void testReplayOutsideGraceWindowRevokesFamilyAndThrows() {
                LocalDateTime now = LocalDateTime.now();

                RefreshTokenRecord staleUsedRecord = RefreshTokenRecord.builder()
                                .id(UUID.randomUUID())
                                .tokenHash(hashedToken)
                                .familyId(familyId)
                                .session(session)
                                .issuedAt(now.minusHours(1))
                                .usedAt(now.minusSeconds(45)) // Used 45 seconds ago (> 30s grace window)
                                .expiresAt(now.plusDays(7))
                                .revokedAt(null)
                                .build();

                when(refreshTokenRecordRepository.findByTokenHash(hashedToken))
                                .thenReturn(Optional.of(staleUsedRecord));
                when(refreshTokenRecordRepository.findAllByFamilyId(familyId))
                                .thenReturn(List.of(staleUsedRecord));

                RefreshTokenRequest request = new RefreshTokenRequest(rawRefreshToken, clientId);

                BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> {
                        authService.refreshToken(request);
                });

                assertEquals("Refresh token reuse detected", exception.getMessage());

                // Verify entire family was revoked and session invalidated
                verify(refreshTokenRecordRepository, atLeastOnce()).findAllByFamilyId(familyId);
                verify(sessionRepository).save(argThat(s -> s.getId().equals(sessionId)
                                && s.getAccessTokenValidTill().isBefore(LocalDateTime.now().plusSeconds(2))));
        }

        @Test
        @DisplayName("Client Mismatch / Replay Attack: Used token replayed within 30s by different client triggers family revocation and throws")
        void testReplayAcrossDifferentClientRevokesFamilyAndThrows() {
                LocalDateTime now = LocalDateTime.now();
                UUID attackerClientId = UUID.randomUUID(); // Different client/device

                RefreshTokenRecord usedRecord = RefreshTokenRecord.builder()
                                .id(UUID.randomUUID())
                                .tokenHash(hashedToken)
                                .familyId(familyId)
                                .session(session)
                                .issuedAt(now.minusMinutes(10))
                                .usedAt(now.minusSeconds(5)) // Within 30s
                                .expiresAt(now.plusDays(7))
                                .revokedAt(null)
                                .build();

                when(refreshTokenRecordRepository.findByTokenHash(hashedToken))
                                .thenReturn(Optional.of(usedRecord));
                when(refreshTokenRecordRepository.findAllByFamilyId(familyId))
                                .thenReturn(List.of(usedRecord));

                RefreshTokenRequest request = new RefreshTokenRequest(rawRefreshToken, attackerClientId);

                BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> {
                        authService.refreshToken(request);
                });

                assertEquals("Client mismatch during token refresh", exception.getMessage());

                // Verify entire family was revoked and session invalidated
                verify(refreshTokenRecordRepository, atLeastOnce()).findAllByFamilyId(familyId);
                verify(sessionRepository).save(argThat(s -> s.getId().equals(sessionId)
                                && s.getAccessTokenValidTill().isBefore(LocalDateTime.now().plusSeconds(2))));
        }

        @Test
        @DisplayName("Explicitly Revoked Token Replay: Presenting revoked token immediately triggers family revocation and throws 401")
        void testRevokedTokenReplayTriggersFamilyRevocation() {
                LocalDateTime now = LocalDateTime.now();

                RefreshTokenRecord revokedRecord = RefreshTokenRecord.builder()
                                .id(UUID.randomUUID())
                                .tokenHash(hashedToken)
                                .familyId(familyId)
                                .session(session)
                                .issuedAt(now.minusHours(2))
                                .usedAt(now.minusHours(1))
                                .revokedAt(now.minusMinutes(30)) // Already explicitly revoked
                                .expiresAt(now.plusDays(7))
                                .build();

                when(refreshTokenRecordRepository.findByTokenHash(hashedToken))
                                .thenReturn(Optional.of(revokedRecord));
                when(refreshTokenRecordRepository.findAllByFamilyId(familyId))
                                .thenReturn(List.of(revokedRecord));

                RefreshTokenRequest request = new RefreshTokenRequest(rawRefreshToken, clientId);

                BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> {
                        authService.refreshToken(request);
                });

                assertEquals("Refresh token revoked", exception.getMessage());

                // Verify family revoked and session invalidated
                verify(refreshTokenRecordRepository, atLeastOnce()).findAllByFamilyId(familyId);
                verify(sessionRepository).save(argThat(s -> s.getId().equals(sessionId)
                                && s.getAccessTokenValidTill().isBefore(LocalDateTime.now().plusSeconds(2))));
        }
}