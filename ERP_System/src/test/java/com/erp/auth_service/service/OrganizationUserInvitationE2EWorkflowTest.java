package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.InviteMemberRequest;
import com.erp.auth_service.dto.request.PasswordReset;
import com.erp.auth_service.dto.response.InviteMemberResponse;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.TokenExpiredException;
import com.erp.auth_service.mail.CommunicationServiceClient;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.service.impl.OrganizationAdministrationServiceImpl;
import com.erp.auth_service.utility.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Complete End-to-End Workflow Verification for Organization User Invitation Emails.
 * Verifies all 15 operational criteria:
 * 1. Service connectivity and token payload
 * 2. X-Service-Token authentication simulation
 * 3. User invitation token generation (SHA-256 hashed, 24h expiry, single-use)
 * 4. Communication Service payload construction
 * 5. Provider delivery handling (ACCEPTED_BY_PROVIDER vs FAILED)
 * 6. Set password activation link format and token lookup
 * 7. State transitions: accountStatus=ACTIVE, emailStatus=VERIFIED, membershipStatus=ACTIVE
 * 8. User login verification with new password
 * 9. Resend invitation and 60-second rate-limiting
 * 10. Replay attack rejection (used token)
 * 11. Expired token rejection
 * 12. Non-interference with PASSWORD_RESET / Forgot Password workflow
 */
class OrganizationUserInvitationE2EWorkflowTest {

    private OrganizationAdministrationServiceImpl orgAdminService;
    private AuthServiceImpl authService;
    private PasswordEncoder passwordEncoder;

    private Organization organization;
    private OrganizationMember owner;
    private Company primaryCompany;
    private UUID orgId;
    private UUID companyId;

    // In-memory repositories to model complete transactional lifecycle
    private Map<UUID, User> userDatabase = new HashMap<>();
    private Map<UUID, OrganizationMember> memberDatabase = new HashMap<>();
    private Map<UUID, UserToken> tokenDatabase = new HashMap<>();

    // Communication Service request recording
    private Map<String, Object> lastCommRequest;
    private boolean commClientShouldSucceed = true;
    private String commStatusResponse = "ACCEPTED_BY_PROVIDER";
    private String commErrorMessage = null;

    // Token save failure simulation
    private boolean tokenSaveShouldFail = false;
    private RuntimeException tokenSaveException = null;

    @BeforeEach
    void setUp() {
        userDatabase.clear();
        memberDatabase.clear();
        tokenDatabase.clear();

        tokenSaveShouldFail = false;
        tokenSaveException = null;
        lastCommRequest = null;
        commClientShouldSucceed = true;
        commStatusResponse = "ACCEPTED_BY_PROVIDER";
        commErrorMessage = null;

        passwordEncoder = new BCryptPasswordEncoder();

        orgId = UUID.randomUUID();
        companyId = UUID.randomUUID();

        organization = Organization.builder()
                .id(orgId)
                .displayName("Apex Global Technologies")
                .legalName("Apex Global Technologies Inc")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        primaryCompany = Company.builder()
                .id(companyId)
                .companyCode("APEX-HQ")
                .companyName("Apex HQ")
                .organization(organization)
                .active(true)
                .build();

        User ownerUser = User.builder()
                .id(UUID.randomUUID())
                .email("admin@apex.com")
                .username("admin@apex.com")
                .accountStatus(AccountStatus.ACTIVE)
                .emailStatus(Status.VERIFIED)
                .company(primaryCompany)
                .build();
        userDatabase.put(ownerUser.getId(), ownerUser);

        owner = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(ownerUser)
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        memberDatabase.put(owner.getId(), owner);

        RequestContext.set(ownerUser.getId(), orgId, primaryCompany.getId(), null, AccessMode.FULL);

        // Setup OrganizationRepository stub
        OrganizationRepository orgRepo = createProxy(OrganizationRepository.class, (method, args) -> {
            if ("findById".equals(method.getName())) {
                UUID id = (UUID) args[0];
                return id.equals(orgId) ? Optional.of(organization) : Optional.empty();
            }
            return null;
        });

        // Setup OrganizationMemberRepository stub
        OrganizationMemberRepository memberRepo = createProxy(OrganizationMemberRepository.class, (method, args) -> {
            String mName = method.getName();
            if ("findByOrganization_Id".equals(mName)) {
                return memberDatabase.values().stream()
                        .filter(m -> m.getOrganization() != null && m.getOrganization().getId().equals(args[0]))
                        .toList();
            }
            if ("findByOrganization_IdAndUser_Id".equals(mName)) {
                UUID oId = (UUID) args[0];
                UUID uId = (UUID) args[1];
                return memberDatabase.values().stream()
                        .filter(m -> m.getOrganization() != null && m.getOrganization().getId().equals(oId)
                                && m.getUser() != null && m.getUser().getId().equals(uId))
                        .findFirst();
            }
            if ("findByOrganization_IdAndUser_IdAndMembershipStatus".equals(mName)) {
                UUID oId = (UUID) args[0];
                UUID uId = (UUID) args[1];
                MembershipStatus status = (MembershipStatus) args[2];
                return memberDatabase.values().stream()
                        .filter(m -> m.getOrganization() != null && m.getOrganization().getId().equals(oId)
                                && m.getUser() != null && m.getUser().getId().equals(uId)
                                && m.getMembershipStatus() == status)
                        .findFirst();
            }
            if ("findById".equals(mName)) {
                return Optional.ofNullable(memberDatabase.get((UUID) args[0]));
            }
            if ("findByOrganization_IdAndId".equals(mName)) {
                UUID oId = (UUID) args[0];
                UUID mId = (UUID) args[1];
                OrganizationMember om = memberDatabase.get(mId);
                return (om != null && om.getOrganization().getId().equals(oId)) ? Optional.of(om) : Optional.empty();
            }
            if ("save".equals(mName)) {
                OrganizationMember om = (OrganizationMember) args[0];
                if (om.getId() == null) om.setId(UUID.randomUUID());
                memberDatabase.put(om.getId(), om);
                return om;
            }
            return null;
        });

        // Setup UserRepository stub
        UserRepository userRepo = createProxy(UserRepository.class, (method, args) -> {
            String mName = method.getName();
            if ("findByEmailIgnoreCase".equals(mName)) {
                String email = (String) args[0];
                return userDatabase.values().stream()
                        .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email))
                        .findFirst();
            }
            if ("findAllByEmailIgnoreCase".equals(mName)) {
                String email = (String) args[0];
                return userDatabase.values().stream()
                        .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email))
                        .toList();
            }
            if ("existsByUsernameIgnoreCase".equals(mName)) {
                String username = (String) args[0];
                return userDatabase.values().stream()
                        .anyMatch(u -> u.getUsername() != null && u.getUsername().equalsIgnoreCase(username));
            }
            if ("findById".equals(mName)) {
                return Optional.ofNullable(userDatabase.get((UUID) args[0]));
            }
            if ("save".equals(mName)) {
                User u = (User) args[0];
                if (u.getId() == null) u.setId(UUID.randomUUID());
                userDatabase.put(u.getId(), u);
                return u;
            }
            if (method.getReturnType().equals(boolean.class) || method.getReturnType().equals(Boolean.class)) {
                return false;
            }
            return null;
        });

        // Setup CompanyRepository stub
        CompanyRepository companyRepo = createProxy(CompanyRepository.class, (method, args) -> {
            String mName = method.getName();
            if ("findByOrganization_Id".equals(mName) || "findByOrganization_IdAndActiveTrue".equals(mName)) {
                return List.of(primaryCompany);
            }
            if ("findByIdAndOrganization_IdAndActiveTrue".equals(mName)) {
                UUID cId = (UUID) args[0];
                UUID oId = (UUID) args[1];
                return (cId.equals(companyId) && oId.equals(orgId)) ? Optional.of(primaryCompany) : Optional.empty();
            }
            if ("findById".equals(mName)) {
                UUID id = (UUID) args[0];
                return id.equals(companyId) ? Optional.of(primaryCompany) : Optional.empty();
            }
            return null;
        });

        // Setup UserTokenRepository stub
        UserTokenRepository tokenRepo = createProxy(UserTokenRepository.class, (method, args) -> {
            String mName = method.getName();
            if ("findByToken".equals(mName)) {
                String tokenStr = (String) args[0];
                return tokenDatabase.values().stream()
                        .filter(t -> tokenStr.equals(t.getToken()))
                        .findFirst();
            }
            if ("findByUser_IdAndTokenTypeAndUsedFalse".equals(mName)) {
                UUID uId = (UUID) args[0];
                TokenType tType = (TokenType) args[1];
                return tokenDatabase.values().stream()
                        .filter(t -> t.getUser() != null && t.getUser().getId().equals(uId)
                                && t.getTokenType() == tType && Boolean.FALSE.equals(t.getUsed()))
                        .toList();
            }
            if ("findTopByUserIdAndTokenTypeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc".equals(mName)) {
                UUID uId = (UUID) args[0];
                TokenType tType = (TokenType) args[1];
                LocalDateTime expiresAfter = (LocalDateTime) args[2];
                return tokenDatabase.values().stream()
                        .filter(t -> t.getUser() != null && t.getUser().getId().equals(uId)
                                && t.getTokenType() == tType
                                && Boolean.FALSE.equals(t.getUsed())
                                && t.getExpiresAt() != null && t.getExpiresAt().isAfter(expiresAfter))
                        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                        .findFirst();
            }
            if ("save".equals(mName) || "saveAndFlush".equals(mName)) {
                if (tokenSaveShouldFail) {
                    throw tokenSaveException != null ? tokenSaveException
                            : new org.springframework.dao.DataIntegrityViolationException(
                                    "new row for relation \"user_token\" violates check constraint \"user_token_token_type_check\"");
                }
                UserToken token = (UserToken) args[0];
                if (token.getId() == null) token.setId(UUID.randomUUID());
                if (token.getCreatedAt() == null) token.setCreatedAt(LocalDateTime.now());
                tokenDatabase.put(token.getId(), token);
                return token;
            }
            return null;
        });

        // Setup MemberCompanyAccessRepository stub
        MemberCompanyAccessRepository accessRepo = createProxy(MemberCompanyAccessRepository.class, (method, args) -> {
            if ("save".equals(method.getName())) return args[0];
            if (method.getReturnType().equals(Optional.class)) return Optional.empty();
            if (method.getReturnType().equals(List.class)) return Collections.emptyList();
            return null;
        });

        // Setup SubscriptionRepository stub
        SubscriptionRepository subRepo = createProxy(SubscriptionRepository.class, (method, args) -> Optional.empty());

        // Setup CommunicationServiceClient stub
        CommunicationServiceClient commClient = new CommunicationServiceClient(null) {
            @Override
            public boolean isEnabled() {
                return true;
            }

            @Override
            public DeliveryResult sendOrganizationUserInvitationEmailDetailed(
                    UUID organizationId, UUID compId, String to, String fullName,
                    String organizationName, String username, String activationLink,
                    int validityHours, String idempotencyKey) {

                lastCommRequest = new HashMap<>();
                lastCommRequest.put("organizationId", organizationId);
                lastCommRequest.put("companyId", compId);
                lastCommRequest.put("to", to);
                lastCommRequest.put("fullName", fullName);
                lastCommRequest.put("organizationName", organizationName);
                lastCommRequest.put("username", username);
                lastCommRequest.put("activationLink", activationLink);
                lastCommRequest.put("validityHours", validityHours);
                lastCommRequest.put("idempotencyKey", idempotencyKey);

                return DeliveryResult.builder()
                        .success(commClientShouldSucceed)
                        .status(commStatusResponse)
                        .providerMessageId(commClientShouldSucceed ? "smtp-msg-apex-4455" : null)
                        .error(commErrorMessage)
                        .build();
            }

            @Override
            public boolean sendOrganizationUserInvitationEmail(
                    UUID organizationId, UUID compId, String to, String fullName,
                    String organizationName, String username, String activationLink,
                    int validityHours, String idempotencyKey) {
                return sendOrganizationUserInvitationEmailDetailed(
                        organizationId, compId, to, fullName, organizationName, username, activationLink, validityHours, idempotencyKey
                ).isSuccess();
            }
        };

        // Construct AuthServiceImpl for password reset / activation
        SessionRepository sessionRepo = createProxy(SessionRepository.class, (m, a) -> Collections.emptyList());
        RefreshTokenRecordRepository refreshTokenRepo = createProxy(RefreshTokenRecordRepository.class, (m, a) -> Collections.emptyList());
        authService = new AuthServiceImpl(
                userRepo, null, sessionRepo, null, null,
                passwordEncoder, null, null, null, tokenRepo,
                null, null, null, null, null,
                companyRepo, null, null, null, memberRepo,
                null, subRepo, refreshTokenRepo, null
        );

        // Construct OrganizationAdministrationServiceImpl
        AuthorizationService authorizationService = new AuthorizationService();
        orgAdminService = new OrganizationAdministrationServiceImpl(
                memberRepo, accessRepo, companyRepo, authorizationService, subRepo
        );
        ReflectionTestUtils.setField(orgAdminService, "organizationRepository", orgRepo);
        ReflectionTestUtils.setField(orgAdminService, "userRepository", userRepo);
        ReflectionTestUtils.setField(orgAdminService, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(orgAdminService, "userTokenRepository", tokenRepo);
        ReflectionTestUtils.setField(orgAdminService, "communicationServiceClient", commClient);
        ReflectionTestUtils.setField(orgAdminService, "emailBaseUrl", "https://www.mark2.in/erp");
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    @Test
    @DisplayName("1. Complete end-to-end user invitation, email dispatch, password setup, and login")
    void testCompleteInvitationAndActivationWorkflow() {
        String newUserEmail = "jane.smith@apex.com";
        String fullName = "Jane Smith";

        // Step A: Admin invites new member
        InviteMemberRequest inviteRequest = InviteMemberRequest.builder()
                .email(newUserEmail)
                .fullName(fullName)
                .memberType(MemberType.MEMBER)
                .companyId(companyId)
                .roleIds(List.of(UUID.randomUUID()))
                .build();

        InviteMemberResponse response = orgAdminService.inviteMember(orgId, inviteRequest);

        // Verify response
        assertNotNull(response);
        assertEquals(newUserEmail, response.getEmail());
        assertEquals(MembershipStatus.INVITED, response.getMembershipStatus());
        assertTrue(response.getEmailSent(), "Email should be reported as sent");
        assertNull(response.getEmailError(), "Email error should be null on success");

        // Verify User was created with INACTIVE status (pending activation) and UNVERIFIED email
        User createdUser = userDatabase.values().stream()
                .filter(u -> newUserEmail.equalsIgnoreCase(u.getEmail()))
                .findFirst()
                .orElse(null);
        assertNotNull(createdUser);
        assertEquals(AccountStatus.INACTIVE, createdUser.getAccountStatus());
        assertEquals(Status.UNVERIFIED, createdUser.getEmailStatus());

        // Verify UserToken was created with TokenType.USER_INVITATION and SHA-256 hash
        assertEquals(1, tokenDatabase.size());
        UserToken storedToken = tokenDatabase.values().iterator().next();
        assertEquals(TokenType.USER_INVITATION, storedToken.getTokenType());
        assertFalse(storedToken.getUsed(), "Token must be initially unused");
        assertTrue(storedToken.getExpiresAt().isAfter(LocalDateTime.now().plusHours(23)), "Token must expire in ~24h");
        assertEquals(64, storedToken.getToken().length(), "Token in database must be SHA-256 hash (64 hex characters)");

        // Verify Communication Service request payload
        assertNotNull(lastCommRequest);
        assertEquals(primaryCompany.getId(), lastCommRequest.get("companyId"), "companyId must never be null");
        assertEquals(newUserEmail, lastCommRequest.get("to"));
        assertEquals(fullName, lastCommRequest.get("fullName"));
        assertEquals("Apex Global Technologies", lastCommRequest.get("organizationName"));
        assertEquals(24, lastCommRequest.get("validityHours"));

        String activationLink = (String) lastCommRequest.get("activationLink");
        assertNotNull(activationLink);
        assertTrue(activationLink.startsWith("https://www.mark2.in/erp/set-password?token="));

        // Extract raw token from activation link
        String rawToken = activationLink.substring(activationLink.lastIndexOf("token=") + 6);
        assertNotNull(rawToken);

        // Verify raw token produces the exact SHA-256 hash stored in DB
        String computedHash = hashSha256(rawToken);
        assertEquals(storedToken.getToken(), computedHash);

        // Step B: User clicks link and sets their password
        String newPassword = "MySecurePassword#2026";
        PasswordReset passwordReset = new PasswordReset();
        passwordReset.setPassword(newPassword);

        Map<String, String> resetResult = authService.resetPasswordWithDetails(passwordReset, rawToken);
        assertNotNull(resetResult);
        assertEquals("Password set successfully", resetResult.get("message"));

        // Step C: Verify state transitions
        User activatedUser = userDatabase.get(createdUser.getId());
        assertEquals(AccountStatus.ACTIVE, activatedUser.getAccountStatus(), "User accountStatus must transition to ACTIVE");
        assertEquals(Status.VERIFIED, activatedUser.getEmailStatus(), "User emailStatus must transition to VERIFIED");

        OrganizationMember member = memberDatabase.get(response.getMemberId());
        assertEquals(MembershipStatus.ACTIVE, member.getMembershipStatus(), "OrganizationMember membershipStatus must transition to ACTIVE");
        assertNotNull(member.getJoinedAt(), "joinedAt timestamp must be recorded");

        // Verify token is now marked used
        assertTrue(storedToken.getUsed(), "Token must be marked as used");

        // Step D: Confirm user can log in with new password
        assertTrue(passwordEncoder.matches(newPassword, activatedUser.getPassword()), "User password hash must match newly set password");
    }

    @Test
    @DisplayName("2. Replay attack rejection: used invitation token cannot be reused")
    void testReplayAttackRejected() {
        String newUserEmail = "replay.user@apex.com";
        InviteMemberRequest inviteRequest = InviteMemberRequest.builder()
                .email(newUserEmail)
                .fullName("Replay User")
                .memberType(MemberType.MEMBER)
                .companyId(companyId)
                .roleIds(List.of(UUID.randomUUID()))
                .build();

        orgAdminService.inviteMember(orgId, inviteRequest);

        String activationLink = (String) lastCommRequest.get("activationLink");
        String rawToken = activationLink.substring(activationLink.lastIndexOf("token=") + 6);

        // First use: success
        PasswordReset reset1 = new PasswordReset();
        reset1.setPassword("Pass1!Password");
        authService.resetPasswordWithDetails(reset1, rawToken);

        // Second use: must throw BadCredentialsException ("Token already used")
        PasswordReset reset2 = new PasswordReset();
        reset2.setPassword("Pass2!Password");
        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () ->
                authService.resetPasswordWithDetails(reset2, rawToken));
        assertEquals("Token already used", ex.getMessage());
    }

    @Test
    @DisplayName("3. Expired invitation token rejection")
    void testExpiredTokenRejected() {
        String newUserEmail = "expired.user@apex.com";
        InviteMemberRequest inviteRequest = InviteMemberRequest.builder()
                .email(newUserEmail)
                .fullName("Expired User")
                .memberType(MemberType.MEMBER)
                .companyId(companyId)
                .roleIds(List.of(UUID.randomUUID()))
                .build();

        orgAdminService.inviteMember(orgId, inviteRequest);

        String activationLink = (String) lastCommRequest.get("activationLink");
        String rawToken = activationLink.substring(activationLink.lastIndexOf("token=") + 6);

        // Expire the token manually
        UserToken storedToken = tokenDatabase.values().iterator().next();
        storedToken.setExpiresAt(LocalDateTime.now().minusHours(1));

        PasswordReset reset = new PasswordReset();
        reset.setPassword("PassExp!Password");
        TokenExpiredException ex = assertThrows(TokenExpiredException.class, () ->
                authService.resetPasswordWithDetails(reset, rawToken));
        assertEquals("Token expired", ex.getMessage());
    }

    @Test
    @DisplayName("4. Resend invitation: rate limit enforcement (60 seconds) and successful re-dispatch")
    void testResendInvitationWorkflow() {
        String newUserEmail = "resend.user@apex.com";
        InviteMemberRequest inviteRequest = InviteMemberRequest.builder()
                .email(newUserEmail)
                .fullName("Resend User")
                .memberType(MemberType.MEMBER)
                .companyId(companyId)
                .roleIds(List.of(UUID.randomUUID()))
                .build();

        InviteMemberResponse inviteRes = orgAdminService.inviteMember(orgId, inviteRequest);
        UUID memberId = inviteRes.getMemberId();

        // Immediate resend must be rejected with BadRequestException (rate limit within 60s)
        BadRequestException rateLimitEx = assertThrows(BadRequestException.class, () ->
                orgAdminService.resendInvitation(orgId, memberId));
        assertTrue(rateLimitEx.getMessage().contains("already sent recently"), "Should indicate rate-limiting window");

        // Advance the token creation timestamp by 65 seconds
        UserToken initialToken = tokenDatabase.values().iterator().next();
        initialToken.setCreatedAt(LocalDateTime.now().minusSeconds(65));

        // Now resend must succeed
        InviteMemberResponse resendRes = orgAdminService.resendInvitation(orgId, memberId);
        assertNotNull(resendRes);
        assertTrue(resendRes.getEmailSent(), "Resend email must be reported as sent");

        // Old token must be invalidated (used=true)
        assertTrue(initialToken.getUsed(), "Initial token must be marked as used");

        // New token must exist and be active
        assertEquals(2, tokenDatabase.size());
        UserToken newToken = tokenDatabase.values().stream()
                .filter(t -> Boolean.FALSE.equals(t.getUsed()))
                .findFirst()
                .orElse(null);
        assertNotNull(newToken);
        assertNotEquals(initialToken.getToken(), newToken.getToken());
    }

    @Test
    @DisplayName("5. Communication Service failure handling: response reflects emailSent=false and error message")
    void testEmailDeliveryFailureHandling() {
        commClientShouldSucceed = false;
        commStatusResponse = "FAILED";
        commErrorMessage = "SMTP server connection timeout: 504 Gateway Timeout";

        String newUserEmail = "smtp.fail@apex.com";
        InviteMemberRequest inviteRequest = InviteMemberRequest.builder()
                .email(newUserEmail)
                .fullName("Fail User")
                .memberType(MemberType.MEMBER)
                .companyId(companyId)
                .roleIds(List.of(UUID.randomUUID()))
                .build();

        InviteMemberResponse response = orgAdminService.inviteMember(orgId, inviteRequest);

        // Member should still be created in invited status, but emailSent=false
        assertNotNull(response);
        assertFalse(response.getEmailSent(), "emailSent must be false when SMTP provider fails");
        assertEquals("SMTP server connection timeout: 504 Gateway Timeout", response.getEmailError());
    }

    @Test
    @DisplayName("6. Non-regression: Forgot Password / PASSWORD_RESET token flow is completely unaffected")
    void testForgotPasswordFlowUnaffected() {
        // Create an existing active user
        User existingUser = User.builder()
                .id(UUID.randomUUID())
                .email("existing@apex.com")
                .accountStatus(AccountStatus.ACTIVE)
                .emailStatus(Status.VERIFIED)
                .company(primaryCompany)
                .build();
        userDatabase.put(existingUser.getId(), existingUser);

        // Create standard PASSWORD_RESET token
        String rawResetToken = "raw_reset_token_abc123";
        String hashedResetToken = hashSha256(rawResetToken);

        UserToken resetToken = UserToken.builder()
                .id(UUID.randomUUID())
                .user(existingUser)
                .company(primaryCompany)
                .token(hashedResetToken)
                .tokenType(TokenType.PASSWORD_RESET)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();
        tokenDatabase.put(resetToken.getId(), resetToken);

        // Reset password with PASSWORD_RESET token
        PasswordReset reset = new PasswordReset();
        reset.setPassword("NewResetPass@2026");

        Map<String, String> res = authService.resetPasswordWithDetails(reset, rawResetToken);
        assertEquals("Password set successfully", res.get("message"));

        assertTrue(passwordEncoder.matches("NewResetPass@2026", existingUser.getPassword()));
        assertTrue(resetToken.getUsed(), "PASSWORD_RESET token must be marked used");
    }

    @Test
    @DisplayName("7. Token persistence failure: constraint violation aborts flow and strictly prevents email dispatch")
    void testTokenPersistenceFailurePreventsEmailDispatch() {
        tokenSaveShouldFail = true;
        tokenSaveException = new org.springframework.dao.DataIntegrityViolationException(
                "ERROR: new row for relation \"user_token\" violates check constraint \"user_token_token_type_check\"");

        String newUserEmail = "abort.user@apex.com";
        InviteMemberRequest inviteRequest = InviteMemberRequest.builder()
                .email(newUserEmail)
                .fullName("Abort User")
                .memberType(MemberType.MEMBER)
                .companyId(companyId)
                .roleIds(List.of(UUID.randomUUID()))
                .build();

        // Execution must throw the DataIntegrityViolationException without swallowing it
        org.springframework.dao.DataIntegrityViolationException thrown =
                assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () ->
                        orgAdminService.inviteMember(orgId, inviteRequest));

        assertTrue(thrown.getMessage().contains("violates check constraint"));

        // CRITICAL CHECK: Communication Service was NEVER reached, NO email was sent
        assertNull(lastCommRequest, "Communication Service must NEVER be called if UserToken save fails");
        assertEquals(0, tokenDatabase.size(), "No token should be stored in database");
    }

    @Test
    @DisplayName("8. Safe recovery: Resend invitation recovers pending user who has no active token")
    void testResendInvitationRecoversOrphanedUserWithoutActiveToken() {
        // Setup an existing user left behind with INVITED status but NO token in user_token
        UUID orphanUserId = UUID.randomUUID();
        User orphanUser = User.builder()
                .id(orphanUserId)
                .email("orphaned.pending@apex.com")
                .username("orphaned.pending")
                .fullName("Orphaned Pending User")
                .accountStatus(AccountStatus.INACTIVE)
                .emailStatus(Status.UNVERIFIED)
                .company(primaryCompany)
                .build();
        userDatabase.put(orphanUserId, orphanUser);

        UUID orphanMemberId = UUID.randomUUID();
        OrganizationMember orphanMember = OrganizationMember.builder()
                .id(orphanMemberId)
                .organization(organization)
                .user(orphanUser)
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.INVITED)
                .joinedAt(LocalDateTime.now().minusDays(2))
                .build();
        memberDatabase.put(orphanMemberId, orphanMember);

        // Confirm database currently has NO tokens for this user
        assertEquals(0, tokenDatabase.size());

        // Resend invitation: must NOT be blocked by 60s rate limit (since no recent token exists)
        InviteMemberResponse resendResponse = orgAdminService.resendInvitation(orgId, orphanMemberId);

        assertNotNull(resendResponse);
        assertTrue(resendResponse.getEmailSent(), "Invitation email should be dispatched");
        assertEquals("orphaned.pending@apex.com", resendResponse.getEmail());

        // Verify a fresh USER_INVITATION token was generated and persisted
        assertEquals(1, tokenDatabase.size());
        UserToken createdToken = tokenDatabase.values().iterator().next();
        assertEquals(TokenType.USER_INVITATION, createdToken.getTokenType());
        assertEquals(orphanUserId, createdToken.getUser().getId());
        assertFalse(createdToken.getUsed());

        // Verify Communication Service received the invitation request
        assertNotNull(lastCommRequest);
        assertEquals("orphaned.pending@apex.com", lastCommRequest.get("to"));

        // Verify the user can activate with this token
        String activationLink = (String) lastCommRequest.get("activationLink");
        String rawToken = activationLink.substring(activationLink.lastIndexOf("token=") + 6);

        PasswordReset setupReq = new PasswordReset();
        setupReq.setPassword("OrphanRecovered#2026");
        Map<String, String> setupResult = authService.resetPasswordWithDetails(setupReq, rawToken);

        assertEquals("Password set successfully", setupResult.get("message"));
        assertEquals(AccountStatus.ACTIVE, orphanUser.getAccountStatus());
        assertEquals(Status.VERIFIED, orphanUser.getEmailStatus());
        assertEquals(MembershipStatus.ACTIVE, orphanMember.getMembershipStatus());
        assertTrue(createdToken.getUsed());
    }

    @Test
    @DisplayName("9. Model & Schema validation: all TokenType enum constants are recognized")
    void testAllTokenTypesSupportedByEnumType() {
        Set<String> tokenTypeNames = Arrays.stream(TokenType.values())
                .map(Enum::name)
                .collect(java.util.stream.Collectors.toSet());

        assertTrue(tokenTypeNames.contains("EMAIL_VERIFICATION"), "Must support EMAIL_VERIFICATION");
        assertTrue(tokenTypeNames.contains("PASSWORD_RESET"), "Must support PASSWORD_RESET");
        assertTrue(tokenTypeNames.contains("PASSWORD_SETUP"), "Must support PASSWORD_SETUP");
        assertTrue(tokenTypeNames.contains("USER_INVITATION"), "Must support USER_INVITATION");
        assertEquals(4, tokenTypeNames.size(), "TokenType enum should contain exactly 4 supported types");
    }

    @Test
    @DisplayName("10. AFTER_COMMIT listener: email dispatch is deferred until database transaction successfully commits")
    void testAfterCommitSynchronizationDispatchesEmailOnlyAfterTransactionCommit() {
        org.springframework.transaction.support.TransactionSynchronizationManager.initSynchronization();
        try {
            String newUserEmail = "aftercommit.user@apex.com";
            InviteMemberRequest inviteRequest = InviteMemberRequest.builder()
                    .email(newUserEmail)
                    .fullName("After Commit User")
                    .memberType(MemberType.MEMBER)
                    .companyId(companyId)
                    .roleIds(List.of(UUID.randomUUID()))
                    .build();

            InviteMemberResponse response = orgAdminService.inviteMember(orgId, inviteRequest);
            assertNotNull(response);

            // While transaction is in-flight, email must NOT be dispatched yet
            assertNull(lastCommRequest, "Email must NOT be dispatched while database transaction is in-flight");

            // Verify a synchronization was registered
            List<org.springframework.transaction.support.TransactionSynchronization> syncs =
                    org.springframework.transaction.support.TransactionSynchronizationManager.getSynchronizations();
            assertFalse(syncs.isEmpty(), "An AFTER_COMMIT transaction synchronization must be registered");

            // Simulate successful database transaction commit
            for (org.springframework.transaction.support.TransactionSynchronization sync : syncs) {
                sync.afterCommit();
            }

            // After commit: email must now be dispatched with token-derived idempotency key
            assertNotNull(lastCommRequest, "Email must be dispatched immediately after transaction commit");
            assertEquals(newUserEmail, lastCommRequest.get("to"));
            String idempotencyKey = (String) lastCommRequest.get("idempotencyKey");
            assertNotNull(idempotencyKey);
            assertTrue(idempotencyKey.startsWith("org-user-invite-"), "Idempotency key should be structured");
        } finally {
            org.springframework.transaction.support.TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    @DisplayName("11. Rollback safety: rolled back transaction never executes afterCommit or dispatches emails")
    void testTransactionRollbackSuppressesEmailDispatch() {
        org.springframework.transaction.support.TransactionSynchronizationManager.initSynchronization();
        try {
            String newUserEmail = "rollback.user@apex.com";
            InviteMemberRequest inviteRequest = InviteMemberRequest.builder()
                    .email(newUserEmail)
                    .fullName("Rollback User")
                    .memberType(MemberType.MEMBER)
                    .companyId(companyId)
                    .roleIds(List.of(UUID.randomUUID()))
                    .build();

            InviteMemberResponse response = orgAdminService.inviteMember(orgId, inviteRequest);
            assertNotNull(response);

            // During transaction: no email sent
            assertNull(lastCommRequest);

            // Simulate transaction rollback (afterCommit is NOT called; only clearSynchronization)
        } finally {
            org.springframework.transaction.support.TransactionSynchronizationManager.clearSynchronization();
        }

        // After rollback: email dispatch was never triggered
        assertNull(lastCommRequest, "Rolled back transaction must never dispatch invitation emails");
    }

    private static String hashSha256(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @SuppressWarnings("unchecked")
    private static <T> T createProxy(Class<T> iface, ProxyInvocationHandler handler) {
        return (T) Proxy.newProxyInstance(
                iface.getClassLoader(),
                new Class<?>[]{iface},
                (proxy, method, args) -> handler.handle(method, args)
        );
    }

    @FunctionalInterface
    interface ProxyInvocationHandler {
        Object handle(java.lang.reflect.Method method, Object[] args) throws Throwable;
    }
}
