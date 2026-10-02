package com.erp.auth_service.service.platform;

import com.erp.auth_service.dto.platform.PlatformAdminLoginRequest;
import com.erp.auth_service.dto.platform.PlatformAdminLoginResponse;
import com.erp.auth_service.exception.AccountLockedException;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.model.platform.PlatformAdmin;
import com.erp.auth_service.model.platform.PlatformAdminStatus;
import com.erp.auth_service.model.platform.PlatformPermission;
import com.erp.auth_service.model.platform.PlatformRole;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.PlatformPermissionRepository;
import com.erp.auth_service.repository.platform.PlatformRoleRepository;
import com.erp.auth_service.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformAdminAuthServiceTest {

    @Mock
    private PlatformAdminRepository platformAdminRepository;

    @Mock
    private PlatformRoleRepository platformRoleRepository;

    @Mock
    private PlatformPermissionRepository platformPermissionRepository;

    @Mock
    private PlatformAuditService platformAuditService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private PlatformAdminAuthService platformAdminAuthService;

    private PlatformAdmin activeAdmin;
    private PlatformRole superAdminRole;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(platformAdminAuthService, "sessionDurationMinutes", 480L);
        ReflectionTestUtils.setField(platformAdminAuthService, "maxFailedAttempts", 5);
        ReflectionTestUtils.setField(platformAdminAuthService, "lockoutMinutes", 15);

        PlatformPermission p1 = PlatformPermission.builder()
                .code("PLATFORM_DASHBOARD_READ")
                .description("Dashboard read")
                .build();

        superAdminRole = PlatformRole.builder()
                .code("SUPER_ADMIN")
                .name("Super Admin")
                .permissions(Set.of(p1))
                .build();

        activeAdmin = PlatformAdmin.builder()
                .id(UUID.randomUUID())
                .email("admin@platform.com")
                .passwordHash("hashedPassword")
                .fullName("Platform Operator")
                .status(PlatformAdminStatus.ACTIVE)
                .failedLoginCount(0)
                .roles(Set.of(superAdminRole))
                .build();
    }

    @Test
    @DisplayName("login: successful credentials returns JWT with platform claims")
    void login_Success() {
        when(platformAdminRepository.findByEmailIgnoreCase("admin@platform.com")).thenReturn(Optional.of(activeAdmin));
        when(passwordEncoder.matches("ValidPassword123!", "hashedPassword")).thenReturn(true);
        when(jwtService.generateAccessToken(eq("admin@platform.com"), anyMap())).thenReturn("mock.platform.jwt");

        PlatformAdminLoginRequest request = PlatformAdminLoginRequest.builder()
                .email("admin@platform.com")
                .password("ValidPassword123!")
                .build();

        PlatformAdminLoginResponse response = platformAdminAuthService.login(request, "127.0.0.1", "TestAgent");

        assertNotNull(response);
        assertEquals("mock.platform.jwt", response.getAccessToken());
        assertEquals(activeAdmin.getId(), response.getAdminId());
        assertEquals("admin@platform.com", response.getEmail());
        assertTrue(response.getRoles().contains("SUPER_ADMIN"));
        assertTrue(response.getPermissions().contains("PLATFORM_DASHBOARD_READ"));

        verify(platformAuditService).record(eq(activeAdmin), eq("admin@platform.com"), eq("ADMIN_LOGIN_SUCCESS"),
                isNull(), isNull(), isNull(), isNull(), eq("PlatformAdmin"), eq(activeAdmin.getId().toString()),
                anyString(), eq("127.0.0.1"), eq("TestAgent"), eq("SUCCESS"), isNull());
    }

    @Test
    @DisplayName("login: non-existent email throws generic BadCredentialsException")
    void login_NonExistentEmail_ThrowsBadCredentials() {
        when(platformAdminRepository.findByEmailIgnoreCase("unknown@platform.com")).thenReturn(Optional.empty());

        PlatformAdminLoginRequest request = PlatformAdminLoginRequest.builder()
                .email("unknown@platform.com")
                .password("anyPassword")
                .build();

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> platformAdminAuthService.login(request, "127.0.0.1", "TestAgent"));

        assertEquals("Invalid credentials", ex.getMessage());
        verify(platformAuditService).record(isNull(), eq("unknown@platform.com"), eq("ADMIN_LOGIN_FAILED"),
                isNull(), isNull(), isNull(), isNull(), eq("PlatformAdmin"), isNull(),
                eq("Admin not found"), eq("127.0.0.1"), eq("TestAgent"), eq("FAILURE"), isNull());
    }

    @Test
    @DisplayName("login: wrong password throws BadCredentialsException and increments failure count")
    void login_WrongPassword_IncrementsFailedCount() {
        when(platformAdminRepository.findByEmailIgnoreCase("admin@platform.com")).thenReturn(Optional.of(activeAdmin));
        when(passwordEncoder.matches("WrongPassword", "hashedPassword")).thenReturn(false);

        PlatformAdminLoginRequest request = PlatformAdminLoginRequest.builder()
                .email("admin@platform.com")
                .password("WrongPassword")
                .build();

        assertThrows(BadCredentialsException.class,
                () -> platformAdminAuthService.login(request, "127.0.0.1", "TestAgent"));

        assertEquals(1, activeAdmin.getFailedLoginCount());
        verify(platformAdminRepository).save(activeAdmin);
    }

    @Test
    @DisplayName("login: exceeds max failed attempts locks account")
    void login_ExceedsMaxAttempts_LocksAccount() {
        activeAdmin.setFailedLoginCount(4);
        when(platformAdminRepository.findByEmailIgnoreCase("admin@platform.com")).thenReturn(Optional.of(activeAdmin));
        when(passwordEncoder.matches("WrongPassword", "hashedPassword")).thenReturn(false);

        PlatformAdminLoginRequest request = PlatformAdminLoginRequest.builder()
                .email("admin@platform.com")
                .password("WrongPassword")
                .build();

        assertThrows(BadCredentialsException.class,
                () -> platformAdminAuthService.login(request, "127.0.0.1", "TestAgent"));

        assertEquals(5, activeAdmin.getFailedLoginCount());
        assertNotNull(activeAdmin.getLockedUntil());
        assertTrue(activeAdmin.getLockedUntil().isAfter(LocalDateTime.now()));
    }

    @Test
    @DisplayName("login: locked account throws AccountLockedException")
    void login_LockedAccount_ThrowsAccountLockedException() {
        activeAdmin.setLockedUntil(LocalDateTime.now().plusMinutes(10));
        when(platformAdminRepository.findByEmailIgnoreCase("admin@platform.com")).thenReturn(Optional.of(activeAdmin));

        PlatformAdminLoginRequest request = PlatformAdminLoginRequest.builder()
                .email("admin@platform.com")
                .password("AnyPassword")
                .build();

        assertThrows(AccountLockedException.class,
                () -> platformAdminAuthService.login(request, "127.0.0.1", "TestAgent"));
    }

    @Test
    @DisplayName("login: inactive admin is rejected")
    void login_InactiveAdmin_Rejected() {
        activeAdmin.setStatus(PlatformAdminStatus.INACTIVE);
        when(platformAdminRepository.findByEmailIgnoreCase("admin@platform.com")).thenReturn(Optional.of(activeAdmin));

        PlatformAdminLoginRequest request = PlatformAdminLoginRequest.builder()
                .email("admin@platform.com")
                .password("AnyPassword")
                .build();

        assertThrows(BadCredentialsException.class,
                () -> platformAdminAuthService.login(request, "127.0.0.1", "TestAgent"));
    }
}
