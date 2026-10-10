package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CreateUserByAdmin;
import com.erp.auth_service.dto.request.PasswordReset;
import com.erp.auth_service.dto.response.UserResponse;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.TokenExpiredException;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.service.impl.UserServiceImpl;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;
import com.erp.auth_service.utility.TokenType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserProvisioningEmailTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserTokenRepository userTokenRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private JwtService jwtService;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private ModuleRepository moduleRepository;
    @Mock
    private JwtDecoder jwtDecoder;
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
    private PermissionService permissionService;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private RefreshTokenRecordRepository refreshTokenRecordRepository;
    @Mock
    private OrganizationResolverService organizationResolverService;

    @org.mockito.InjectMocks
    private AuthServiceImpl authService;

    private UserServiceImpl userService;

    private UUID companyId;
    private UUID moduleId;
    private Company company;
    private Module module;
    private Organization organization;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        moduleId = UUID.randomUUID();

        organization = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("techcorp-org")
                .displayName("TechCorp Organization")
                .build();

        company = Company.builder()
                .id(companyId)
                .companyCode("techcorp")
                .companyName("TechCorp Pvt Ltd")
                .organization(organization)
                .active(true)
                .build();

        module = Module.builder()
                .id(moduleId)
                .name("accounts")
                .moduleStatus(true)
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(companyRepository.findByCompanyCode("techcorp")).thenReturn(Optional.of(company));
        when(moduleRepository.findById(moduleId)).thenReturn(Optional.of(module));
        when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "encoded_" + inv.getArgument(0));

        userService = new UserServiceImpl(
                userRepository, userMapper, passwordEncoder, userTokenRepository,
                emailService, jwtService, sessionRepository, companyRepository,
                moduleRepository, jwtDecoder, organizationMemberRepository,
                memberCompanyAccessRepository, subscriptionRepository,
                organizationModuleRepository, companyModuleRepository,
                userPortalAccessRepository, null, null, null, roleRepository,
                permissionService
        );
        ReflectionTestUtils.setField(userService, "emailBaseUrl", "https://www.mark2.in/erp");
        ReflectionTestUtils.setField(userService, "setupExpirationHours", 24);
        ReflectionTestUtils.setField(authService, "url", "https://www.mark2.in/erp");
    }

    private String sha256Hex(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("Creating user generates password setup token, stores hash, and emails correct company login URL")
    void testCreateUser_GeneratesToken_AndSendsEmail_WithCompanyLoginUrl() {
        CreateUserByAdmin request = CreateUserByAdmin.builder()
                .empId("EMP-001")
                .username("john.doe")
                .fullName("John Doe")
                .email("john@techcorp.com")
                .build();

        when(userRepository.findByCompany_IdAndUsernameIgnoreCase(companyId, "john.doe")).thenReturn(Optional.empty());
        when(userRepository.findByCompany_IdAndEmailIgnoreCase(companyId, "john@techcorp.com")).thenReturn(Optional.empty());

        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserResponse mockResponse = UserResponse.builder()
                .username("john.doe")
                .email("john@techcorp.com")
                .build();
        when(userMapper.toResponse(any(User.class))).thenReturn(mockResponse);

        UserResponse result = userService.create(request, companyId, moduleId);

        assertNotNull(result);
        assertTrue(result.getEmailSent());
        assertNull(result.getEmailError());
        assertEquals(UserServiceImpl.ONBOARDING_NOTES, result.getNotes());

        // Verify User was saved with inactive/unverified status and notes
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertEquals(AccountStatus.INACTIVE, saved.getAccountStatus());
        assertEquals(Status.UNVERIFIED, saved.getEmailStatus());
        assertEquals(UserServiceImpl.ONBOARDING_NOTES, saved.getNotes());

        // Verify UserToken was saved with PASSWORD_SETUP type and 24h expiration
        ArgumentCaptor<UserToken> tokenCaptor = ArgumentCaptor.forClass(UserToken.class);
        verify(userTokenRepository).save(tokenCaptor.capture());
        UserToken savedToken = tokenCaptor.getValue();
        assertEquals(TokenType.PASSWORD_SETUP, savedToken.getTokenType());
        assertFalse(savedToken.getUsed());
        assertTrue(savedToken.getExpiresAt().isAfter(LocalDateTime.now().plusHours(23)));

        // Verify Email was sent with company-specific URL: https://www.mark2.in/erp/c/techcorp/login
        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> setupLinkCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> loginUrlCaptor = ArgumentCaptor.forClass(String.class);

        verify(emailService).sendProvisioningEmail(
                emailCaptor.capture(),
                eq("John Doe"),
                eq("TechCorp Pvt Ltd"),
                eq("john.doe"),
                setupLinkCaptor.capture(),
                loginUrlCaptor.capture(),
                eq(24)
        );

        assertEquals("john@techcorp.com", emailCaptor.getValue());
        assertTrue(setupLinkCaptor.getValue().startsWith("https://www.mark2.in/erp/set-password?token="));
        assertEquals("https://www.mark2.in/erp/c/techcorp/login", loginUrlCaptor.getValue());
    }

    @Test
    @DisplayName("Email failure is handled gracefully and subsequent retry updates pending user without duplicate error")
    void testCreateUser_EmailDeliveryFailure_HandledGracefully_WithoutDuplicate() {
        CreateUserByAdmin request = CreateUserByAdmin.builder()
                .empId("EMP-002")
                .username("jane.doe")
                .fullName("Jane Doe")
                .email("jane@techcorp.com")
                .build();

        when(userRepository.findByCompany_IdAndUsernameIgnoreCase(companyId, "jane.doe")).thenReturn(Optional.empty());
        when(userRepository.findByCompany_IdAndEmailIgnoreCase(companyId, "jane@techcorp.com")).thenReturn(Optional.empty());

        UUID userId = UUID.randomUUID();
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(userId);
            return u;
        });

        when(userMapper.toResponse(any(User.class))).thenReturn(UserResponse.builder().username("jane.doe").build());

        // Simulate mail delivery failure
        doThrow(new RuntimeException("SMTP connection timed out"))
                .when(emailService).sendProvisioningEmail(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyInt());

        UserResponse firstResult = userService.create(request, companyId, moduleId);

        assertNotNull(firstResult);
        assertFalse(firstResult.getEmailSent());
        assertTrue(firstResult.getEmailError().contains("SMTP connection timed out"));

        // Now simulate administrator RETRYING the form submission with the same email/username
        User pendingUser = User.builder()
                .id(userId)
                .username("jane.doe")
                .email("jane@techcorp.com")
                .accountStatus(AccountStatus.INACTIVE)
                .emailStatus(Status.UNVERIFIED)
                .company(company)
                .build();
        when(userRepository.findByCompany_IdAndEmailIgnoreCase(companyId, "jane@techcorp.com")).thenReturn(Optional.of(pendingUser));

        // Reset email service mock so second attempt succeeds
        doNothing().when(emailService).sendProvisioningEmail(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyInt());

        UserResponse retryResult = userService.create(request, companyId, moduleId);
        assertTrue(retryResult.getEmailSent());
        assertNull(retryResult.getEmailError());
    }

    @Test
    @DisplayName("Password setup succeeds with single-use token, activates user, and rejects repeat use")
    void testResetPasswordWithDetails_ActivatesUser_AndInvalidatesToken() {
        String rawToken = "secure-random-token-xyz-123";
        String hashedToken = sha256Hex(rawToken);

        User pendingUser = User.builder()
                .id(UUID.randomUUID())
                .username("emp.user")
                .email("emp@techcorp.com")
                .accountStatus(AccountStatus.INACTIVE)
                .emailStatus(Status.UNVERIFIED)
                .company(company)
                .build();

        UserToken tokenRecord = UserToken.builder()
                .id(UUID.randomUUID())
                .token(hashedToken)
                .tokenType(TokenType.PASSWORD_SETUP)
                .user(pendingUser)
                .company(company)
                .used(false)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        when(userTokenRepository.findByToken(hashedToken)).thenReturn(Optional.of(tokenRecord));

        PasswordReset passwordReset = new PasswordReset();
        passwordReset.setPassword("NewSecurePassword123@#");

        Map<String, String> response = authService.resetPasswordWithDetails(passwordReset, rawToken);

        assertNotNull(response);
        assertEquals("Password set successfully", response.get("message"));
        assertEquals("techcorp", response.get("companyCode"));
        assertEquals("https://www.mark2.in/erp/c/techcorp/login", response.get("companyLoginUrl"));

        // User is now ACTIVE and VERIFIED
        assertEquals(AccountStatus.ACTIVE, pendingUser.getAccountStatus());
        assertEquals(Status.VERIFIED, pendingUser.getEmailStatus());
        assertTrue(tokenRecord.getUsed());

        // Reusing token fails with BadCredentialsException
        assertThrows(BadCredentialsException.class, () -> authService.resetPasswordWithDetails(passwordReset, rawToken));
    }

    @Test
    @DisplayName("Expired setup token is rejected with TokenExpiredException")
    void testResetPasswordWithDetails_ExpiredToken_Rejected() {
        String rawToken = "expired-token";
        String hashedToken = sha256Hex(rawToken);

        User user = User.builder().id(UUID.randomUUID()).company(company).build();
        UserToken expiredToken = UserToken.builder()
                .id(UUID.randomUUID())
                .token(hashedToken)
                .tokenType(TokenType.PASSWORD_SETUP)
                .user(user)
                .company(company)
                .used(false)
                .expiresAt(LocalDateTime.now().minusMinutes(5)) // Expired
                .build();

        when(userTokenRepository.findByToken(hashedToken)).thenReturn(Optional.of(expiredToken));

        PasswordReset passwordReset = new PasswordReset();
        passwordReset.setPassword("Password123@#");

        assertThrows(TokenExpiredException.class, () -> authService.resetPasswordWithDetails(passwordReset, rawToken));
    }
}
