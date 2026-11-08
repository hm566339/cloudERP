package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.AuthorizationCheckRequest;
import com.erp.auth_service.dto.request.GrantPermissionRequest;
import com.erp.auth_service.dto.request.RevokePermissionRequest;
import com.erp.auth_service.dto.request.SyncPermissionsRequest;
import com.erp.auth_service.dto.response.AuthorizationCheckResponse;
import com.erp.auth_service.dto.response.FeaturePermissionResponse;
import com.erp.auth_service.dto.response.UserActivePermissionsResponse;
import com.erp.auth_service.dto.response.UserPermissionResponse;
import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.UserPermissionDetailDto;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.Feature;
import com.erp.auth_service.model.FeaturePermission;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.RolePermission;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserPermission;
import com.erp.auth_service.model.UserRole;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.UserPortalAccess;
import com.erp.auth_service.repository.FeaturePermissionRepository;
import com.erp.auth_service.repository.FeatureRepository;
import com.erp.auth_service.repository.RolePermissionRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.repository.UserPermissionRepository;
import com.erp.auth_service.repository.UserRepository;
import com.erp.auth_service.service.impl.PermissionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PermissionServiceImplTest {

    @Mock
    private FeaturePermissionRepository featurePermissionRepository;

    @Mock
    private UserPermissionRepository userPermissionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private FeatureRepository featureRepository;

    @Mock
    private com.erp.auth_service.repository.CompanyModuleRepository companyModuleRepository;

    @Mock
    private com.erp.auth_service.repository.UserPortalAccessRepository userPortalAccessRepository;

    @Mock
    private com.erp.auth_service.repository.OrganizationMemberRepository organizationMemberRepository;

    @InjectMocks
    private PermissionServiceImpl permissionService;

    private UUID adminUserId;
    private UUID targetUserId;
    private User targetUser;
    private Feature paymentsFeature;
    private Feature inactiveFeature;
    private FeaturePermission paymentsRead;
    private FeaturePermission paymentsWrite;
    private FeaturePermission paymentsDelete;
    private FeaturePermission inactivePermission;

    private Feature dashboardFeature;
    private FeaturePermission dashboardRead;
    private Feature customersFeature;
    private FeaturePermission customersRead;
    private Role roleDashboard;
    private Role rolePayments;

    @BeforeEach
    void setUp() {
        adminUserId = UUID.randomUUID();
        targetUserId = UUID.randomUUID();

        Company testCompany = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("COMP001")
                .companyName("Test Enterprise")
                .build();

        targetUser = User.builder()
                .id(targetUserId)
                .username("john.accountant")
                .company(testCompany)
                .build();

        paymentsFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("PAYMENTS")
                .name("Payment Operations")
                .moduleName("ACCOUNT")
                .active(true)
                .build();

        inactiveFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("LEGACY")
                .name("Legacy Operations")
                .moduleName("LEGACY")
                .active(false)
                .build();

        paymentsRead = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(paymentsFeature)
                .action("READ")
                .permissionCode("PAYMENTS:READ")
                .active(true)
                .build();

        paymentsWrite = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(paymentsFeature)
                .action("WRITE")
                .permissionCode("PAYMENTS:WRITE")
                .active(true)
                .build();

        paymentsDelete = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(paymentsFeature)
                .action("DELETE")
                .permissionCode("PAYMENTS:DELETE")
                .active(true)
                .build();

        inactivePermission = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(inactiveFeature)
                .action("READ")
                .permissionCode("LEGACY:READ")
                .active(false)
                .build();

        dashboardFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("DASHBOARD")
                .name("Dashboard")
                .moduleName("ACCOUNT")
                .active(true)
                .build();

        dashboardRead = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(dashboardFeature)
                .action("READ")
                .permissionCode("DASHBOARD:READ")
                .active(true)
                .build();

        customersFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("CUSTOMERS")
                .name("Customers")
                .moduleName("ACCOUNT")
                .active(true)
                .build();

        customersRead = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(customersFeature)
                .action("READ")
                .permissionCode("CUSTOMERS:READ")
                .active(true)
                .build();

        roleDashboard = Role.builder()
                .id(UUID.randomUUID())
                .name("ACCOUNTANT")
                .status(true)
                .build();

        rolePayments = Role.builder()
                .id(UUID.randomUUID())
                .name("PAYMENT_OPERATOR")
                .status(true)
                .build();
    }

    private void bindActiveRole(Role role, FeaturePermission... permissions) {
        targetUser.setUserRoles(List.of(UserRole.builder()
                .user(targetUser)
                .role(role)
                .build()));
        when(rolePermissionRepository.findByRole_Id(role.getId()))
                .thenReturn(java.util.Arrays.stream(permissions)
                        .map(p -> RolePermission.builder().role(role).permission(p).build())
                        .toList());
    }

    private void stubEffectiveBaseline() {
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(userPermissionRepository.findByUser_Id(targetUserId)).thenReturn(List.of());
    }

    @Test
    @DisplayName("Should list all feature permissions across the catalog")
    void getAllPermissions_ReturnsAllCatalogPermissions() {
        when(featurePermissionRepository.findAll()).thenReturn(List.of(paymentsRead, paymentsWrite, paymentsDelete));

        List<FeaturePermissionResponse> result = permissionService.getAllPermissions();

        assertEquals(3, result.size());
        assertEquals("PAYMENTS:READ", result.get(0).getPermissionCode());
        assertEquals("PAYMENTS:WRITE", result.get(1).getPermissionCode());
        assertEquals("PAYMENTS:DELETE", result.get(2).getPermissionCode());
    }

    @Test
    @DisplayName("Should get active permission codes for target user")
    void getActivePermissions_ReturnsCodes() {
        bindActiveRole(rolePayments, paymentsRead);
        stubEffectiveBaseline();
        when(featurePermissionRepository.findAll())
                .thenReturn(List.of(paymentsRead, paymentsWrite, paymentsDelete, inactivePermission));

        UserActivePermissionsResponse response = permissionService.getActivePermissions(targetUserId);

        assertEquals(targetUserId, response.getUserId());
        assertTrue(response.getPermissions().contains("PAYMENTS:READ"));
        assertFalse(response.getPermissions().contains("PAYMENTS:WRITE"));
        assertFalse(response.getPermissions().contains("LEGACY:READ"));
    }

    @Test
    @DisplayName("Should grant READ permission to a user")
    void grantPermission_NewAssignment_Success() {
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(featurePermissionRepository.findByFeature_CodeIgnoreCaseAndActionIgnoreCase("PAYMENTS", "READ"))
                .thenReturn(Optional.of(paymentsRead));
        when(userPermissionRepository.findByUser_IdAndPermission_Id(targetUserId, paymentsRead.getId()))
                .thenReturn(Optional.empty());
        when(userPermissionRepository.save(any(UserPermission.class))).thenAnswer(i -> {
            UserPermission up = i.getArgument(0);
            up.setId(UUID.randomUUID());
            return up;
        });

        GrantPermissionRequest request = GrantPermissionRequest.builder()
                .featureCode("PAYMENTS")
                .action("READ")
                .build();

        UserPermissionResponse response = permissionService.grantPermission(adminUserId, targetUserId, request);

        assertNotNull(response);
        assertEquals("PAYMENTS:READ", response.getPermissionCode());
        assertEquals("READ", response.getAction());
        assertTrue(response.isActive());
        assertFalse(response.isRevoked());
        verify(userPermissionRepository, times(1)).save(any(UserPermission.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when granting with unsupported action")
    void grantPermission_InvalidAction_ThrowsBadRequestException() {
        GrantPermissionRequest request = GrantPermissionRequest.builder()
                .featureCode("PAYMENTS")
                .action("EXECUTE_ARBITRARY")
                .build();

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));

        assertThrows(BadRequestException.class, () ->
                permissionService.grantPermission(adminUserId, targetUserId, request));
    }

    @Test
    @DisplayName("Should throw BadRequestException when granting inactive feature or permission")
    void grantPermission_Inactive_ThrowsBadRequestException() {
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(featurePermissionRepository.findByFeature_CodeIgnoreCaseAndActionIgnoreCase("LEGACY", "READ"))
                .thenReturn(Optional.of(inactivePermission));

        GrantPermissionRequest request = GrantPermissionRequest.builder()
                .featureCode("LEGACY")
                .action("READ")
                .build();

        assertThrows(BadRequestException.class, () ->
                permissionService.grantPermission(adminUserId, targetUserId, request));
    }

    @Test
    @DisplayName("Should revoke WRITE permission from user")
    void revokePermission_Success() {
        UserPermission existing = UserPermission.builder()
                .id(UUID.randomUUID())
                .user(targetUser)
                .permission(paymentsWrite)
                .active(true)
                .revoked(false)
                .grantedAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(featurePermissionRepository.findByFeature_CodeIgnoreCaseAndActionIgnoreCase("PAYMENTS", "WRITE"))
                .thenReturn(Optional.of(paymentsWrite));
        when(userPermissionRepository.findByUser_IdAndPermission_Id(targetUserId, paymentsWrite.getId()))
                .thenReturn(Optional.of(existing));
        when(userPermissionRepository.save(any(UserPermission.class))).thenAnswer(i -> i.getArgument(0));

        RevokePermissionRequest request = RevokePermissionRequest.builder()
                .featureCode("PAYMENTS")
                .action("WRITE")
                .reason("Security downgrade")
                .build();

        UserPermissionResponse response = permissionService.revokePermission(adminUserId, targetUserId, request);

        assertFalse(response.isActive());
        assertTrue(response.isRevoked());
        assertEquals("Security downgrade", response.getRevokeReason());
        assertNotNull(response.getRevokedAt());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when revoking unassigned permission")
    void revokePermission_Unassigned_ThrowsNotFound() {
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(featurePermissionRepository.findByFeature_CodeIgnoreCaseAndActionIgnoreCase("PAYMENTS", "DELETE"))
                .thenReturn(Optional.of(paymentsDelete));
        when(userPermissionRepository.findByUser_IdAndPermission_Id(targetUserId, paymentsDelete.getId()))
                .thenReturn(Optional.empty());

        RevokePermissionRequest request = RevokePermissionRequest.builder()
                .featureCode("PAYMENTS")
                .action("DELETE")
                .build();

        assertThrows(ResourceNotFoundException.class, () ->
                permissionService.revokePermission(adminUserId, targetUserId, request));
    }

    @Test
    @DisplayName("Internal checkPermission returns allowed true when permission is active")
    void checkPermission_Active_ReturnsAllowedTrue() {
        bindActiveRole(rolePayments, paymentsRead);
        stubEffectiveBaseline();
        when(featurePermissionRepository.findAll()).thenReturn(List.of(paymentsRead));

        AuthorizationCheckRequest request = AuthorizationCheckRequest.builder()
                .userId(targetUserId)
                .featureCode("PAYMENTS")
                .action("READ")
                .serviceName("account-service")
                .build();

        AuthorizationCheckResponse response = permissionService.checkPermission(request);

        assertTrue(response.isAllowed());
        assertEquals("PAYMENTS:READ", response.getPermissionCode());
    }

    @Test
    @DisplayName("Internal checkPermission returns allowed false when permission is missing or inactive")
    void checkPermission_Missing_ReturnsAllowedFalse() {
        bindActiveRole(rolePayments, paymentsRead);
        stubEffectiveBaseline();
        when(featurePermissionRepository.findAll()).thenReturn(List.of(paymentsRead, paymentsWrite));

        AuthorizationCheckRequest request = AuthorizationCheckRequest.builder()
                .userId(targetUserId)
                .featureCode("PAYMENTS")
                .action("DELETE")
                .serviceName("account-service")
                .build();

        AuthorizationCheckResponse response = permissionService.checkPermission(request);

        assertFalse(response.isAllowed());
        assertEquals("PAYMENTS:DELETE", response.getPermissionCode());
    }

    @Test
    @DisplayName("Should include DASHBOARD:READ granted through an active role")
    void getEffectivePermissions_includesDashboardReadViaRole() {
        bindActiveRole(roleDashboard, dashboardRead);
        stubEffectiveBaseline();
        when(featurePermissionRepository.findAll()).thenReturn(List.of(dashboardRead));

        EffectivePermissionsResponse result = permissionService.getEffectivePermissions(targetUserId);

        assertTrue(result.getRoles().contains("ACCOUNTANT"));
        UserPermissionDetailDto permission = result.getPermissions().stream()
                .filter(p -> "DASHBOARD:READ".equals(p.getPermissionCode()))
                .findFirst().orElse(null);
        assertNotNull(permission);
        assertEquals("DASHBOARD", permission.getFeatureCode());
        assertEquals("READ", permission.getAction());
        assertEquals("ACCOUNT", permission.getModuleName());
        assertEquals("ROLE", permission.getSource());
        assertTrue(permission.isActive());
        assertTrue(permission.isAllowed());
        assertTrue(result.getFeatures().stream().anyMatch(f -> "DASHBOARD".equals(f.getFeatureCode())));
    }

@Test
    @DisplayName("Should include CUSTOMERS:READ granted directly to the user")
    void getEffectivePermissions_includesUserGrantedCustomersRead() {
        targetUser.setUserRoles(List.of());
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(userPermissionRepository.findByUser_Id(targetUserId))
                .thenReturn(List.of(UserPermission.builder()
                        .id(UUID.randomUUID())
                        .user(targetUser)
                        .permission(customersRead)
                        .active(true)
                        .revoked(false)
                        .grantedAt(LocalDateTime.now())
                        .build()));
        when(featurePermissionRepository.findAll()).thenReturn(List.of(customersRead));

        EffectivePermissionsResponse result = permissionService.getEffectivePermissions(targetUserId);

        UserPermissionDetailDto permission = result.getPermissions().stream()
                .filter(p -> "CUSTOMERS:READ".equals(p.getPermissionCode()))
                .findFirst().orElse(null);
        assertNotNull(permission);
        assertEquals("USER_GRANTED", permission.getSource());
        assertTrue(permission.isActive());
        assertTrue(permission.isAllowed());
    }

    @Test
    @DisplayName("Should exclude inactive permissions from effective result")
    void getEffectivePermissions_excludesInactivePermission() {
        targetUser.setUserRoles(List.of());
        stubEffectiveBaseline();
        when(featurePermissionRepository.findAll()).thenReturn(List.of(inactivePermission));

        EffectivePermissionsResponse result = permissionService.getEffectivePermissions(targetUserId);

        assertTrue(result.getPermissions().stream()
                .noneMatch(p -> "LEGACY:READ".equals(p.getPermissionCode())));
        assertTrue(result.getFeatures().stream().noneMatch(f -> "LEGACY".equals(f.getFeatureCode())));
    }

@Test
    @DisplayName("Revoked permission is returned as allowed=false and excluded from active+allowed set")
    void getEffectivePermissions_marksRevokedPermissionAsNotAllowed() {
        targetUser.setUserRoles(List.of());
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(userPermissionRepository.findByUser_Id(targetUserId))
                .thenReturn(List.of(UserPermission.builder()
                        .id(UUID.randomUUID())
                        .user(targetUser)
                        .permission(paymentsRead)
                        .active(false)
                        .revoked(true)
                        .grantedAt(LocalDateTime.now())
                        .build()));
        when(featurePermissionRepository.findAll()).thenReturn(List.of(paymentsRead));

        EffectivePermissionsResponse result = permissionService.getEffectivePermissions(targetUserId);

        UserPermissionDetailDto permission = result.getPermissions().stream()
                .filter(p -> "PAYMENTS:READ".equals(p.getPermissionCode()))
                .findFirst().orElse(null);
        assertNotNull(permission);
        assertEquals("USER_REVOKED", permission.getSource());
        assertFalse(permission.isAllowed());

        List<String> activeAllowed = result.getPermissions().stream()
                .filter(UserPermissionDetailDto::isAllowed)
                .map(UserPermissionDetailDto::getPermissionCode)
                .toList();
        assertFalse(activeAllowed.contains("PAYMENTS:READ"));
    }

    @Test
    @DisplayName("User without permissions or roles does not receive fabricated permissions")
    void getEffectivePermissions_noPermissions_returnsEmptyLists() {
        targetUser.setUserRoles(List.of());
        stubEffectiveBaseline();
        when(featurePermissionRepository.findAll()).thenReturn(List.of());

        EffectivePermissionsResponse result = permissionService.getEffectivePermissions(targetUserId);

        assertTrue(result.getPermissions().isEmpty());
        assertTrue(result.getFeatures().isEmpty());
        assertTrue(result.getRoles().isEmpty());
    }

    @Test
    @DisplayName("Should assign permissions to OWNER role for active modules idempotently")
    void assignOwnerRolePermissions_assignsTargetModulePermissionsAndIgnoresExisting() {
        Role ownerRole = Role.builder().id(UUID.randomUUID()).name("OWNER").status(true).build();
        FeaturePermission existingFp = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .permissionCode("CORE:READ")
                .active(true)
                .feature(Feature.builder().code("CORE").moduleName("CORE").active(true).build())
                .build();
        FeaturePermission accountFp = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .permissionCode("DASHBOARD:READ")
                .active(true)
                .feature(Feature.builder().code("DASHBOARD").moduleName("ACCOUNT").active(true).build())
                .build();

        when(featurePermissionRepository.findByActiveTrue()).thenReturn(List.of(existingFp, accountFp));
        when(rolePermissionRepository.findByRole_Id(ownerRole.getId())).thenReturn(List.of(
                RolePermission.builder().role(ownerRole).permission(existingFp).build()
        ));

        permissionService.assignOwnerRolePermissions(ownerRole, List.of("accountDev"), adminUserId);

        org.mockito.ArgumentCaptor<List<RolePermission>> captor = org.mockito.ArgumentCaptor.forClass(List.class);
        org.mockito.Mockito.verify(rolePermissionRepository).saveAll(captor.capture());
        List<RolePermission> saved = captor.getValue();
        assertEquals(1, saved.size());
        assertEquals("DASHBOARD:READ", saved.get(0).getPermission().getPermissionCode());
        assertEquals(adminUserId, saved.get(0).getGrantedBy());
    }

    @Test
    @DisplayName("Should include Account dashboard permission for OWNER in company with Account module")
    void getEffectivePermissions_withCompanyId_ownerWithAccount_returnsDashboardAllowed() {
        UUID companyId = UUID.randomUUID();
        Company company = Company.builder().id(companyId).companyName("Acme Corp").build();
        Role ownerRole = Role.builder().id(UUID.randomUUID()).company(company).name("OWNER").status(true).build();
        targetUser.setUserRoles(List.of(UserRole.builder().user(targetUser).role(ownerRole).build()));

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(userPermissionRepository.findByUser_Id(targetUserId)).thenReturn(List.of());

        Module accountModule = Module.builder().id(UUID.randomUUID()).name("accountDev").moduleStatus(true).build();
        CompanyModule cm = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(accountModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyId)).thenReturn(List.of(cm));
        when(userPortalAccessRepository.findAllByUser_Id(targetUserId)).thenReturn(List.of(
                UserPortalAccess.builder().companyModule(cm).status(true).build()
        ));

        when(rolePermissionRepository.findByRole_Id(ownerRole.getId())).thenReturn(List.of(
                RolePermission.builder().role(ownerRole).permission(dashboardRead).build()
        ));
        when(featurePermissionRepository.findAll()).thenReturn(List.of(dashboardRead));

        EffectivePermissionsResponse result = permissionService.getEffectivePermissions(targetUserId, companyId);

        assertEquals(1, result.getRoles().size());
        assertEquals("OWNER", result.getRoles().get(0));
        assertTrue(result.getPermissions().stream()
                .anyMatch(p -> "DASHBOARD:READ".equals(p.getPermissionCode()) && p.isAllowed()));
    }

    @Test
    @DisplayName("Should exclude Account permissions for inventory-only company even if role has permissions")
    void getEffectivePermissions_inventoryOnlyCompany_excludesAccountPermissions() {
        UUID inventoryCompanyId = UUID.randomUUID();
        Company company = Company.builder().id(inventoryCompanyId).companyName("Inventory Only").build();
        Role role = Role.builder().id(UUID.randomUUID()).company(company).name("OWNER").status(true).build();
        targetUser.setUserRoles(List.of(UserRole.builder().user(targetUser).role(role).build()));

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(userPermissionRepository.findByUser_Id(targetUserId)).thenReturn(List.of());

        Module inventoryModule = Module.builder().id(UUID.randomUUID()).name("inventory").moduleStatus(true).build();
        CompanyModule cm = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(inventoryModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(inventoryCompanyId)).thenReturn(List.of(cm));
        when(userPortalAccessRepository.findAllByUser_Id(targetUserId)).thenReturn(List.of(
                UserPortalAccess.builder().companyModule(cm).status(true).build()
        ));

        when(rolePermissionRepository.findByRole_Id(role.getId())).thenReturn(List.of(
                RolePermission.builder().role(role).permission(dashboardRead).build()
        ));
        when(featurePermissionRepository.findAll()).thenReturn(List.of(dashboardRead));

        EffectivePermissionsResponse result = permissionService.getEffectivePermissions(targetUserId, inventoryCompanyId);

        // DASHBOARD has moduleName ACCOUNT, but company only has inventory module -> excluded!
        assertTrue(result.getPermissions().stream().noneMatch(p -> "DASHBOARD:READ".equals(p.getPermissionCode())));
    }

    @Test
    @DisplayName("Vishal Organization: Default Company VISHAL with OWNER role gets active/allowed permissions for both ACCOUNT and INVENTORY modules")
    void getEffectivePermissions_vishalOwnerWithAccountAndInventory_returnsBothModulesAllowed() {
        UUID vishalCompanyId = UUID.randomUUID();
        Company vishalCompany = Company.builder().id(vishalCompanyId).companyName("VISHAL").build();
        Role ownerRole = Role.builder().id(UUID.randomUUID()).company(vishalCompany).name("OWNER").status(true).build();
        targetUser.setUserRoles(List.of(UserRole.builder().user(targetUser).role(ownerRole).build()));

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(userPermissionRepository.findByUser_Id(targetUserId)).thenReturn(List.of());

        Module accountModule = Module.builder().id(UUID.randomUUID()).name("accountDev").moduleStatus(true).build();
        CompanyModule cmAccount = CompanyModule.builder().id(UUID.randomUUID()).company(vishalCompany).module(accountModule).active(true).build();

        Module inventoryModule = Module.builder().id(UUID.randomUUID()).name("inventory").moduleStatus(true).build();
        CompanyModule cmInventory = CompanyModule.builder().id(UUID.randomUUID()).company(vishalCompany).module(inventoryModule).active(true).build();

        when(companyModuleRepository.findByCompany_IdAndActiveTrue(vishalCompanyId)).thenReturn(List.of(cmAccount, cmInventory));
        when(userPortalAccessRepository.findAllByUser_Id(targetUserId)).thenReturn(List.of(
                UserPortalAccess.builder().companyModule(cmAccount).status(true).build(),
                UserPortalAccess.builder().companyModule(cmInventory).status(true).build()
        ));

        FeaturePermission inventoryStockRead = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .permissionCode("STOCK:READ")
                .active(true)
                .feature(Feature.builder().code("STOCK").moduleName("INVENTORY").active(true).build())
                .build();

        when(rolePermissionRepository.findByRole_Id(ownerRole.getId())).thenReturn(List.of(
                RolePermission.builder().role(ownerRole).permission(dashboardRead).build(),
                RolePermission.builder().role(ownerRole).permission(inventoryStockRead).build()
        ));
        when(featurePermissionRepository.findAll()).thenReturn(List.of(dashboardRead, inventoryStockRead));

        EffectivePermissionsResponse result = permissionService.getEffectivePermissions(targetUserId, vishalCompanyId);

        assertEquals(1, result.getRoles().size());
        assertEquals("OWNER", result.getRoles().get(0));
        assertTrue(result.getPermissions().stream()
                .anyMatch(p -> "DASHBOARD:READ".equals(p.getPermissionCode()) && p.isAllowed()));
        assertTrue(result.getPermissions().stream()
                .anyMatch(p -> "STOCK:READ".equals(p.getPermissionCode()) && p.isAllowed()));
    }

    @Test
    @DisplayName("Should recalculate effective permissions when switching company")
    void getEffectivePermissions_companySwitch_recalculates() {
        UUID companyA = UUID.randomUUID();
        UUID companyB = UUID.randomUUID();
        Company cA = Company.builder().id(companyA).build();
        Company cB = Company.builder().id(companyB).build();

        Role roleA = Role.builder().id(UUID.randomUUID()).company(cA).name("ROLE_A").status(true).build();
        Role roleB = Role.builder().id(UUID.randomUUID()).company(cB).name("ROLE_B").status(true).build();
        targetUser.setUserRoles(List.of(
                UserRole.builder().user(targetUser).role(roleA).build(),
                UserRole.builder().user(targetUser).role(roleB).build()
        ));

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(userPermissionRepository.findByUser_Id(targetUserId)).thenReturn(List.of());

        Module accountModule = Module.builder().id(UUID.randomUUID()).name("accountDev").moduleStatus(true).build();
        CompanyModule cmA = CompanyModule.builder().id(UUID.randomUUID()).company(cA).module(accountModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyA)).thenReturn(List.of(cmA));
        when(userPortalAccessRepository.findAllByUser_Id(targetUserId)).thenReturn(List.of(
                UserPortalAccess.builder().companyModule(cmA).status(true).build()
        ));

        when(rolePermissionRepository.findByRole_Id(roleA.getId())).thenReturn(List.of(
                RolePermission.builder().role(roleA).permission(dashboardRead).build()
        ));
        when(featurePermissionRepository.findAll()).thenReturn(List.of(dashboardRead));

        EffectivePermissionsResponse resultA = permissionService.getEffectivePermissions(targetUserId, companyA);
        assertEquals(List.of("ROLE_A"), resultA.getRoles());
        assertTrue(resultA.getPermissions().stream().anyMatch(p -> "DASHBOARD:READ".equals(p.getPermissionCode())));

        // Switch to Company B where no module is active
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyB)).thenReturn(List.of());
        when(rolePermissionRepository.findByRole_Id(roleB.getId())).thenReturn(List.of());

        EffectivePermissionsResponse resultB = permissionService.getEffectivePermissions(targetUserId, companyB);
        assertEquals(List.of("ROLE_B"), resultB.getRoles());
        assertTrue(resultB.getPermissions().stream().noneMatch(p -> "DASHBOARD:READ".equals(p.getPermissionCode())));
    }

    @Test
    @DisplayName("Should successfully create WORKFLOW_DEFINITIONS:ACTIVATE permission")
    void createPermission_activateAction_success() {
        Feature workflowFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("WORKFLOW_DEFINITIONS")
                .name("Workflow Definitions")
                .moduleName("WORKFLOW")
                .active(true)
                .build();

        when(featurePermissionRepository.findByFeature_CodeIgnoreCaseAndActionIgnoreCase("WORKFLOW_DEFINITIONS", "ACTIVATE"))
                .thenReturn(Optional.empty());
        when(featureRepository.findByCodeIgnoreCase("WORKFLOW_DEFINITIONS"))
                .thenReturn(Optional.of(workflowFeature));
        when(featurePermissionRepository.save(any(FeaturePermission.class)))
                .thenAnswer(inv -> {
                    FeaturePermission fp = inv.getArgument(0);
                    fp.setId(UUID.randomUUID());
                    return fp;
                });

        com.erp.auth_service.dto.request.CreatePermissionRequest req = com.erp.auth_service.dto.request.CreatePermissionRequest.builder()
                .featureCode("WORKFLOW_DEFINITIONS")
                .action("ACTIVATE")
                .description("Activate workflow definitions")
                .active(true)
                .build();

        FeaturePermissionResponse res = permissionService.createPermission(req);
        assertNotNull(res);
        assertEquals("WORKFLOW_DEFINITIONS", res.getFeatureCode());
        assertEquals("ACTIVATE", res.getAction());
        assertEquals("WORKFLOW_DEFINITIONS:ACTIVATE", res.getPermissionCode());
        assertTrue(res.isActive());
    }

    @Test
    @DisplayName("Should successfully create WORKFLOW_DEFINITIONS:DEACTIVATE permission")
    void createPermission_deactivateAction_success() {
        Feature workflowFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("WORKFLOW_DEFINITIONS")
                .name("Workflow Definitions")
                .moduleName("WORKFLOW")
                .active(true)
                .build();

        when(featurePermissionRepository.findByFeature_CodeIgnoreCaseAndActionIgnoreCase("WORKFLOW_DEFINITIONS", "DEACTIVATE"))
                .thenReturn(Optional.empty());
        when(featureRepository.findByCodeIgnoreCase("WORKFLOW_DEFINITIONS"))
                .thenReturn(Optional.of(workflowFeature));
        when(featurePermissionRepository.save(any(FeaturePermission.class)))
                .thenAnswer(inv -> {
                    FeaturePermission fp = inv.getArgument(0);
                    fp.setId(UUID.randomUUID());
                    return fp;
                });

        com.erp.auth_service.dto.request.CreatePermissionRequest req = com.erp.auth_service.dto.request.CreatePermissionRequest.builder()
                .featureCode("WORKFLOW_DEFINITIONS")
                .action("DEACTIVATE")
                .description("Deactivate workflow definitions")
                .active(true)
                .build();

        FeaturePermissionResponse res = permissionService.createPermission(req);
        assertNotNull(res);
        assertEquals("WORKFLOW_DEFINITIONS", res.getFeatureCode());
        assertEquals("DEACTIVATE", res.getAction());
        assertEquals("WORKFLOW_DEFINITIONS:DEACTIVATE", res.getPermissionCode());
        assertTrue(res.isActive());
    }

    @Test
    @DisplayName("Should throw BadRequestException for unsupported action")
    void createPermission_unsupportedAction_throwsBadRequest() {
        com.erp.auth_service.dto.request.CreatePermissionRequest req = com.erp.auth_service.dto.request.CreatePermissionRequest.builder()
                .featureCode("WORKFLOW_DEFINITIONS")
                .action("NON_EXISTENT_ACTION")
                .description("Invalid action")
                .active(true)
                .build();

        assertThrows(BadRequestException.class, () -> permissionService.createPermission(req));
    }

    @Test
    @DisplayName("Should assign and verify effective permissions for ACTIVATE and DEACTIVATE")
    void assignAndVerify_activateAndDeactivateEffectivePermissions() {
        UUID companyId = UUID.randomUUID();
        Company comp = Company.builder().id(companyId).build();
        Role workflowAdminRole = Role.builder().id(UUID.randomUUID()).company(comp).name("WORKFLOW_ADMIN").status(true).build();

        Feature wfFeature = Feature.builder().id(UUID.randomUUID()).code("WORKFLOW_DEFINITIONS").name("Workflow Definitions").moduleName("WORKFLOW").active(true).build();
        FeaturePermission activatePerm = FeaturePermission.builder()
                .id(UUID.randomUUID()).feature(wfFeature).action("ACTIVATE").permissionCode("WORKFLOW_DEFINITIONS:ACTIVATE").active(true).build();
        FeaturePermission deactivatePerm = FeaturePermission.builder()
                .id(UUID.randomUUID()).feature(wfFeature).action("DEACTIVATE").permissionCode("WORKFLOW_DEFINITIONS:DEACTIVATE").active(true).build();

        targetUser.setUserRoles(List.of(UserRole.builder().user(targetUser).role(workflowAdminRole).build()));

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(userPermissionRepository.findByUser_Id(targetUserId)).thenReturn(List.of());

        Module wfModule = Module.builder().id(UUID.randomUUID()).name("WORKFLOW").moduleStatus(true).build();
        CompanyModule cm = CompanyModule.builder().id(UUID.randomUUID()).company(comp).module(wfModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyId)).thenReturn(List.of(cm));
        when(userPortalAccessRepository.findAllByUser_Id(targetUserId)).thenReturn(List.of(
                UserPortalAccess.builder().companyModule(cm).status(true).build()
        ));

        when(rolePermissionRepository.findByRole_Id(workflowAdminRole.getId())).thenReturn(List.of(
                RolePermission.builder().role(workflowAdminRole).permission(activatePerm).build(),
                RolePermission.builder().role(workflowAdminRole).permission(deactivatePerm).build()
        ));
        when(featurePermissionRepository.findAll()).thenReturn(List.of(activatePerm, deactivatePerm));

        EffectivePermissionsResponse res = permissionService.getEffectivePermissions(targetUserId, companyId);
        assertNotNull(res);
        assertEquals(2, res.getPermissions().size());

        UserPermissionDetailDto p1 = res.getPermissions().stream()
                .filter(p -> "WORKFLOW_DEFINITIONS:ACTIVATE".equals(p.getPermissionCode()))
                .findFirst().orElseThrow();
        assertEquals("WORKFLOW_DEFINITIONS", p1.getFeatureCode());
        assertEquals("ACTIVATE", p1.getAction());
        assertTrue(p1.isActive());
        assertTrue(p1.isAllowed());

        UserPermissionDetailDto p2 = res.getPermissions().stream()
                .filter(p -> "WORKFLOW_DEFINITIONS:DEACTIVATE".equals(p.getPermissionCode()))
                .findFirst().orElseThrow();
        assertEquals("WORKFLOW_DEFINITIONS", p2.getFeatureCode());
        assertEquals("DEACTIVATE", p2.getAction());
        assertTrue(p2.isActive());
        assertTrue(p2.isAllowed());
    }
}
