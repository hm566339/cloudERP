package com.erp.auth_service.service.platform;

import com.erp.auth_service.dto.platform.*;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.InvalidOperationException;
import com.erp.auth_service.model.platform.*;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.PlatformRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformAdminManagementServiceTest {

    @Mock
    private PlatformAdminRepository platformAdminRepository;

    @Mock
    private PlatformRoleRepository platformRoleRepository;

    @Mock
    private PlatformAuditService platformAuditService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PlatformAdminManagementService platformAdminManagementService;

    private PlatformRole superAdminRole;
    private PlatformRole supportAdminRole;
    private PlatformAdmin activeSuperAdmin;
    private UUID callingAdminId;

    @BeforeEach
    void setUp() {
        callingAdminId = UUID.randomUUID();

        superAdminRole = PlatformRole.builder()
                .id(UUID.randomUUID())
                .code("SUPER_ADMIN")
                .name("Super Admin")
                .permissions(new HashSet<>())
                .build();

        supportAdminRole = PlatformRole.builder()
                .id(UUID.randomUUID())
                .code("SUPPORT_ADMIN")
                .name("Support Admin")
                .permissions(new HashSet<>())
                .build();

        activeSuperAdmin = PlatformAdmin.builder()
                .id(UUID.randomUUID())
                .email("super@platform.com")
                .passwordHash("hashed")
                .fullName("Root Admin")
                .status(PlatformAdminStatus.ACTIVE)
                .roles(new HashSet<>(List.of(superAdminRole)))
                .build();
    }

    @Test
    @DisplayName("createAdmin: creates new admin successfully")
    void createAdmin_Success() {
        when(platformAdminRepository.existsByEmailIgnoreCase("support@platform.com")).thenReturn(false);
        when(platformRoleRepository.findByCode("SUPPORT_ADMIN")).thenReturn(Optional.of(supportAdminRole));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(platformAdminRepository.save(any())).thenAnswer(inv -> {
            PlatformAdmin a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        CreatePlatformAdminRequest req = CreatePlatformAdminRequest.builder()
                .email("support@platform.com")
                .password("Secr3t!Pass")
                .fullName("Support User")
                .roleCodes(List.of("SUPPORT_ADMIN"))
                .build();

        PlatformAdminResponse resp = platformAdminManagementService.createAdmin(req, callingAdminId, "127.0.0.1", "Agent");

        assertNotNull(resp);
        assertEquals("support@platform.com", resp.getEmail());
        assertTrue(resp.getRoles().contains("SUPPORT_ADMIN"));
    }

    @Test
    @DisplayName("createAdmin: duplicate email throws DuplicateResourceException")
    void createAdmin_DuplicateEmail_ThrowsException() {
        when(platformAdminRepository.existsByEmailIgnoreCase("super@platform.com")).thenReturn(true);

        CreatePlatformAdminRequest req = CreatePlatformAdminRequest.builder()
                .email("super@platform.com")
                .password("Secr3t!Pass")
                .fullName("Root Admin")
                .roleCodes(List.of("SUPER_ADMIN"))
                .build();

        assertThrows(DuplicateResourceException.class,
                () -> platformAdminManagementService.createAdmin(req, callingAdminId, "127.0.0.1", "Agent"));
    }

    @Test
    @DisplayName("updateStatus: protects the last active SUPER_ADMIN from being disabled")
    void updateStatus_LastSuperAdmin_ThrowsInvalidOperationException() {
        when(platformAdminRepository.findById(activeSuperAdmin.getId())).thenReturn(Optional.of(activeSuperAdmin));
        when(platformAdminRepository.countByStatusAndRoleCode(PlatformAdminStatus.ACTIVE, "SUPER_ADMIN")).thenReturn(1L);

        UpdatePlatformAdminStatusRequest req = UpdatePlatformAdminStatusRequest.builder()
                .status(PlatformAdminStatus.INACTIVE)
                .build();

        InvalidOperationException ex = assertThrows(InvalidOperationException.class,
                () -> platformAdminManagementService.updateStatus(activeSuperAdmin.getId(), req, callingAdminId, "127.0.0.1", "Agent"));

        assertEquals("Cannot disable the last active SUPER_ADMIN", ex.getMessage());
    }

    @Test
    @DisplayName("updateStatus: allows disabling super admin when another active super admin exists")
    void updateStatus_MultipleSuperAdmins_Allowed() {
        when(platformAdminRepository.findById(activeSuperAdmin.getId())).thenReturn(Optional.of(activeSuperAdmin));
        when(platformAdminRepository.countByStatusAndRoleCode(PlatformAdminStatus.ACTIVE, "SUPER_ADMIN")).thenReturn(2L);
        when(platformAdminRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdatePlatformAdminStatusRequest req = UpdatePlatformAdminStatusRequest.builder()
                .status(PlatformAdminStatus.INACTIVE)
                .build();

        PlatformAdminResponse resp = platformAdminManagementService.updateStatus(activeSuperAdmin.getId(), req, callingAdminId, "127.0.0.1", "Agent");

        assertEquals(PlatformAdminStatus.INACTIVE, resp.getStatus());
    }

    @Test
    @DisplayName("updateRoles: protects the last active SUPER_ADMIN from being demoted")
    void updateRoles_LastSuperAdmin_ThrowsInvalidOperationException() {
        when(platformAdminRepository.findById(activeSuperAdmin.getId())).thenReturn(Optional.of(activeSuperAdmin));
        when(platformAdminRepository.countByStatusAndRoleCode(PlatformAdminStatus.ACTIVE, "SUPER_ADMIN")).thenReturn(1L);

        UpdatePlatformAdminRoleRequest req = UpdatePlatformAdminRoleRequest.builder()
                .roleCodes(List.of("SUPPORT_ADMIN"))
                .build();

        InvalidOperationException ex = assertThrows(InvalidOperationException.class,
                () -> platformAdminManagementService.updateRoles(activeSuperAdmin.getId(), req, callingAdminId, "127.0.0.1", "Agent"));

        assertEquals("Cannot remove SUPER_ADMIN role from the last active SUPER_ADMIN", ex.getMessage());
    }
}
