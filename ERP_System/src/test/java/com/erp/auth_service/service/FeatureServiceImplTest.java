package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.GrantFeatureRequest;
import com.erp.auth_service.dto.request.RevokeFeatureRequest;
import com.erp.auth_service.dto.request.SyncUserFeaturesRequest;
import com.erp.auth_service.dto.response.FeatureResponse;
import com.erp.auth_service.dto.response.UserActiveFeaturesResponse;
import com.erp.auth_service.dto.response.UserFeatureResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.Feature;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserFeature;
import com.erp.auth_service.repository.FeatureRepository;
import com.erp.auth_service.repository.UserFeatureRepository;
import com.erp.auth_service.repository.UserRepository;
import com.erp.auth_service.service.impl.FeatureServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeatureServiceImplTest {

    @Mock
    private FeatureRepository featureRepository;

    @Mock
    private UserFeatureRepository userFeatureRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.erp.auth_service.repository.FeaturePermissionRepository featurePermissionRepository;

    @InjectMocks
    private FeatureServiceImpl featureService;

    private UUID adminUserId;
    private UUID targetUserId;
    private User targetUser;
    private Feature paymentsFeature;
    private Feature reportsFeature;
    private Feature inactiveFeature;

    @BeforeEach
    void setUp() {
        adminUserId = UUID.randomUUID();
        targetUserId = UUID.randomUUID();

        Company company = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("1001")
                .companyName("Test Tenant")
                .build();

        targetUser = User.builder()
                .id(targetUserId)
                .username("john_doe")
                .company(company)
                .build();

        paymentsFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("PAYMENTS")
                .name("Payment Operations")
                .moduleName("ACCOUNT")
                .active(true)
                .build();

        reportsFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("REPORTS")
                .name("System Reports")
                .moduleName("ACCOUNT")
                .active(true)
                .build();

        inactiveFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("OBSOLETE_FEATURE")
                .name("Old Feature")
                .moduleName("LEGACY")
                .active(false)
                .build();
    }

    @Test
    @DisplayName("getAllFeatures should return all catalog features")
    void testGetAllFeatures() {
        when(featureRepository.findAll()).thenReturn(List.of(paymentsFeature, reportsFeature));

        List<FeatureResponse> result = featureService.getAllFeatures();

        assertEquals(2, result.size());
        assertEquals("PAYMENTS", result.get(0).getCode());
        assertEquals("REPORTS", result.get(1).getCode());
    }

    @Test
    @DisplayName("grantFeature should successfully grant feature to user")
    void testGrantFeature_Success() {
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(featureRepository.findByCodeIgnoreCase("PAYMENTS")).thenReturn(Optional.of(paymentsFeature));
        when(userFeatureRepository.findByUser_IdAndFeature_Id(targetUserId, paymentsFeature.getId()))
                .thenReturn(Optional.empty());

        when(userFeatureRepository.save(any(UserFeature.class))).thenAnswer(invocation -> {
            UserFeature uf = invocation.getArgument(0);
            uf.setId(UUID.randomUUID());
            return uf;
        });

        GrantFeatureRequest request = GrantFeatureRequest.builder()
                .featureCode("PAYMENTS")
                .build();

        UserFeatureResponse response = featureService.grantFeature(adminUserId, targetUserId, request);

        assertNotNull(response);
        assertEquals("PAYMENTS", response.getFeatureCode());
        assertEquals(targetUserId, response.getUserId());
        assertTrue(response.isActive());
        assertFalse(response.isRevoked());
        assertEquals(adminUserId, response.getGrantedBy());
        verify(userFeatureRepository, times(1)).save(any(UserFeature.class));
    }

    @Test
    @DisplayName("grantFeature should fail when feature is inactive")
    void testGrantFeature_InactiveFeature_ThrowsBadRequest() {
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(featureRepository.findByCodeIgnoreCase("OBSOLETE_FEATURE")).thenReturn(Optional.of(inactiveFeature));

        GrantFeatureRequest request = GrantFeatureRequest.builder()
                .featureCode("OBSOLETE_FEATURE")
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                featureService.grantFeature(adminUserId, targetUserId, request));

        assertTrue(ex.getMessage().contains("Cannot grant inactive feature"));
        verify(userFeatureRepository, never()).save(any());
    }

    @Test
    @DisplayName("grantFeature should be idempotent when feature already granted")
    void testGrantFeature_DuplicateGrant_Idempotent() {
        UserFeature existing = UserFeature.builder()
                .id(UUID.randomUUID())
                .user(targetUser)
                .feature(paymentsFeature)
                .grantedBy(adminUserId)
                .grantedAt(LocalDateTime.now().minusDays(1))
                .active(true)
                .revoked(false)
                .build();

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(featureRepository.findByCodeIgnoreCase("PAYMENTS")).thenReturn(Optional.of(paymentsFeature));
        when(userFeatureRepository.findByUser_IdAndFeature_Id(targetUserId, paymentsFeature.getId()))
                .thenReturn(Optional.of(existing));
        when(userFeatureRepository.save(existing)).thenReturn(existing);

        GrantFeatureRequest request = GrantFeatureRequest.builder()
                .featureCode("PAYMENTS")
                .build();

        UserFeatureResponse response = featureService.grantFeature(adminUserId, targetUserId, request);

        assertNotNull(response);
        assertTrue(response.isActive());
        assertFalse(response.isRevoked());
        verify(userFeatureRepository, times(1)).save(existing);
    }

    @Test
    @DisplayName("revokeFeature should successfully revoke granted feature")
    void testRevokeFeature_Success() {
        UserFeature existing = UserFeature.builder()
                .id(UUID.randomUUID())
                .user(targetUser)
                .feature(paymentsFeature)
                .grantedBy(adminUserId)
                .grantedAt(LocalDateTime.now().minusDays(2))
                .active(true)
                .revoked(false)
                .build();

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(featureRepository.findByCodeIgnoreCase("PAYMENTS")).thenReturn(Optional.of(paymentsFeature));
        when(userFeatureRepository.findByUser_IdAndFeature_Id(targetUserId, paymentsFeature.getId()))
                .thenReturn(Optional.of(existing));
        when(userFeatureRepository.save(existing)).thenReturn(existing);

        RevokeFeatureRequest request = RevokeFeatureRequest.builder()
                .featureCode("PAYMENTS")
                .reason("Security audit revocation")
                .build();

        UserFeatureResponse response = featureService.revokeFeature(adminUserId, targetUserId, request);

        assertNotNull(response);
        assertTrue(response.isRevoked());
        assertFalse(response.isActive());
        assertEquals("Security audit revocation", response.getRevokeReason());
        assertEquals(adminUserId, response.getRevokedBy());
    }

    @Test
    @DisplayName("revokeFeature should throw ResourceNotFoundException if feature is not assigned")
    void testRevokeFeature_NotAssigned_ThrowsNotFound() {
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(featureRepository.findByCodeIgnoreCase("PAYMENTS")).thenReturn(Optional.of(paymentsFeature));
        when(userFeatureRepository.findByUser_IdAndFeature_Id(targetUserId, paymentsFeature.getId()))
                .thenReturn(Optional.empty());

        RevokeFeatureRequest request = RevokeFeatureRequest.builder()
                .featureCode("PAYMENTS")
                .build();

        assertThrows(ResourceNotFoundException.class, () ->
                featureService.revokeFeature(adminUserId, targetUserId, request));
    }

    @Test
    @DisplayName("getActiveFeatures should return only active and unrevoked feature codes")
    void testGetActiveFeatures() {
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(userFeatureRepository.findActiveFeatureCodesByUserId(targetUserId))
                .thenReturn(List.of("PAYMENTS", "REPORTS"));

        UserActiveFeaturesResponse response = featureService.getActiveFeatures(targetUserId);

        assertNotNull(response);
        assertEquals(targetUserId, response.getUserId());
        assertEquals(List.of("PAYMENTS", "REPORTS"), response.getActiveFeatures());
    }

    @Test
    @DisplayName("syncUserFeatures should synchronize feature list completely")
    void testSyncUserFeatures() {
        UserFeature existingPayments = UserFeature.builder()
                .id(UUID.randomUUID())
                .user(targetUser)
                .feature(paymentsFeature)
                .active(true)
                .revoked(false)
                .build();

        List<UserFeature> currentList = new ArrayList<>(List.of(existingPayments));

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(featureRepository.findByCodeIgnoreCase("REPORTS")).thenReturn(Optional.of(reportsFeature));
        when(userFeatureRepository.findAllByUser_Id(targetUserId)).thenReturn(currentList);

        // Desired: only REPORTS (PAYMENTS should be revoked, REPORTS added)
        SyncUserFeaturesRequest request = SyncUserFeaturesRequest.builder()
                .featureCodes(List.of("REPORTS"))
                .build();

        featureService.syncUserFeatures(adminUserId, targetUserId, request);

        verify(userFeatureRepository, times(1)).saveAll(any());
        assertTrue(existingPayments.isRevoked());
        assertFalse(existingPayments.isActive());
    }

    @Test
    @DisplayName("createFeature should create global feature and auto-provision standard action permissions")
    void testCreateFeature_Success_WithDefaultActionPermissions() {
        when(featureRepository.findByCodeIgnoreCase("PAYMENTS")).thenReturn(Optional.empty());
        when(featureRepository.save(any(Feature.class))).thenAnswer(invocation -> {
            Feature f = invocation.getArgument(0);
            f.setId(UUID.randomUUID());
            return f;
        });
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase(anyString())).thenReturn(Optional.empty());

        com.erp.auth_service.dto.request.CreateFeatureRequest request = com.erp.auth_service.dto.request.CreateFeatureRequest.builder()
                .code("PAYMENTS")
                .name("Payment Operations")
                .moduleName("ACCOUNT")
                .active(true)
                .build();

        FeatureResponse response = featureService.createFeature(request);

        assertNotNull(response);
        assertEquals("PAYMENTS", response.getCode());
        assertEquals("Payment Operations", response.getName());
        assertEquals("ACCOUNT", response.getModuleName());
        assertTrue(response.isActive());

        verify(featureRepository, times(1)).save(any(Feature.class));
        // Verify auto-provisioning of READ, WRITE, and DELETE permissions
        verify(featurePermissionRepository, times(3)).save(any(com.erp.auth_service.model.FeaturePermission.class));
    }

    @Test
    @DisplayName("createFeature should create global feature with specified dynamic actions")
    void testCreateFeature_Success_WithCustomDynamicActions() {
        when(featureRepository.findByCodeIgnoreCase("INVOICES")).thenReturn(Optional.empty());
        when(featureRepository.save(any(Feature.class))).thenAnswer(invocation -> {
            Feature f = invocation.getArgument(0);
            f.setId(UUID.randomUUID());
            return f;
        });
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase(anyString())).thenReturn(Optional.empty());

        com.erp.auth_service.dto.request.CreateFeatureRequest request = com.erp.auth_service.dto.request.CreateFeatureRequest.builder()
                .code("INVOICES")
                .name("Invoice Management")
                .moduleName("ACCOUNT")
                .active(true)
                .actions(List.of("READ", "WRITE", "DELETE", "APPROVE", "EXPORT"))
                .build();

        FeatureResponse response = featureService.createFeature(request);

        assertNotNull(response);
        assertEquals("INVOICES", response.getCode());
        verify(featureRepository, times(1)).save(any(Feature.class));
        verify(featurePermissionRepository, times(5)).save(any(com.erp.auth_service.model.FeaturePermission.class));
    }

    @Test
    @DisplayName("updateFeature should dynamically add new actions and soft-deactivate removed actions")
    void testUpdateFeature_DynamicActionsUpdate() {
        UUID featureId = paymentsFeature.getId();
        when(featureRepository.findById(featureId)).thenReturn(Optional.of(paymentsFeature));
        when(featureRepository.save(any(Feature.class))).thenReturn(paymentsFeature);

        com.erp.auth_service.model.FeaturePermission readPerm = com.erp.auth_service.model.FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(paymentsFeature)
                .action("READ")
                .permissionCode("PAYMENTS:READ")
                .active(true)
                .build();

        com.erp.auth_service.model.FeaturePermission writePerm = com.erp.auth_service.model.FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(paymentsFeature)
                .action("WRITE")
                .permissionCode("PAYMENTS:WRITE")
                .active(true)
                .build();

        com.erp.auth_service.model.FeaturePermission deletePerm = com.erp.auth_service.model.FeaturePermission.builder()
                .id(UUID.randomUUID())
                .feature(paymentsFeature)
                .action("DELETE")
                .permissionCode("PAYMENTS:DELETE")
                .active(true)
                .build();

        when(featurePermissionRepository.findByFeature_Id(featureId))
                .thenReturn(List.of(readPerm, writePerm, deletePerm));

        // Desired target actions: READ, APPROVE (WRITE and DELETE removed, APPROVE added)
        com.erp.auth_service.dto.request.UpdateFeatureRequest updateRequest = com.erp.auth_service.dto.request.UpdateFeatureRequest.builder()
                .name("Payment Operations Updated")
                .actions(List.of("READ", "APPROVE"))
                .build();

        FeatureResponse response = featureService.updateFeature(featureId, updateRequest);

        assertNotNull(response);
        // APPROVE should be created
        verify(featurePermissionRepository, times(1)).save(argThat(fp -> "APPROVE".equalsIgnoreCase(fp.getAction()) && fp.isActive()));
        // WRITE and DELETE should be soft-deactivated (active=false)
        assertFalse(writePerm.isActive());
        assertFalse(deletePerm.isActive());
        assertTrue(readPerm.isActive());
    }
}
