package com.erp.auth_service.config;

import com.erp.auth_service.model.Feature;
import com.erp.auth_service.model.FeaturePermission;
import com.erp.auth_service.repository.FeaturePermissionRepository;
import com.erp.auth_service.repository.FeatureRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeatureBootstrapManufacturingTest {
    @Mock private FeatureRepository featureRepository;
    @Mock private FeaturePermissionRepository featurePermissionRepository;
    @InjectMocks private FeatureBootstrap featureBootstrap;

    private void setupMocks() {
        when(featureRepository.findByCodeIgnoreCase(anyString())).thenAnswer(inv -> {
            String code = inv.getArgument(0);
            return Optional.of(Feature.builder().id(UUID.randomUUID()).code(code.toUpperCase()).name(code).moduleName("MANUFACTURING").active(true).build());
        });
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(featurePermissionRepository.save(any(FeaturePermission.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test @DisplayName("MANUFACTURING feature gets all 13 actions including manufacturing-specific ones")
    void testManufacturingFeatureHasAllActions() {
        setupMocks();
        featureBootstrap.run();
        ArgumentCaptor<FeaturePermission> c = ArgumentCaptor.forClass(FeaturePermission.class);
        verify(featurePermissionRepository, atLeastOnce()).save(c.capture());
        List<String> codes = c.getAllValues().stream().map(FeaturePermission::getPermissionCode).toList();
        assertThat(codes).contains("MANUFACTURING:READ","MANUFACTURING:CREATE","MANUFACTURING:WRITE","MANUFACTURING:UPDATE","MANUFACTURING:DELETE","MANUFACTURING:SUBMIT","MANUFACTURING:APPROVE","MANUFACTURING:REJECT","MANUFACTURING:RELEASE","MANUFACTURING:COMPLETE","MANUFACTURING:CONSUME","MANUFACTURING:RESERVE","MANUFACTURING:CANCEL");
    }

    @Test @DisplayName("MFG_BOM gets SUBMIT APPROVE REJECT actions")
    void testMfgBomHasApprovalActions() {
        setupMocks();
        featureBootstrap.run();
        ArgumentCaptor<FeaturePermission> c = ArgumentCaptor.forClass(FeaturePermission.class);
        verify(featurePermissionRepository, atLeastOnce()).save(c.capture());
        List<String> codes = c.getAllValues().stream().map(FeaturePermission::getPermissionCode).toList();
        assertThat(codes).contains("MFG_BOM:READ","MFG_BOM:SUBMIT","MFG_BOM:APPROVE","MFG_BOM:REJECT");
    }

    @Test @DisplayName("MFG_PRODUCTION gets RELEASE APPROVE REJECT CANCEL actions")
    void testMfgProductionHasReleaseAction() {
        setupMocks();
        featureBootstrap.run();
        ArgumentCaptor<FeaturePermission> c = ArgumentCaptor.forClass(FeaturePermission.class);
        verify(featurePermissionRepository, atLeastOnce()).save(c.capture());
        List<String> codes = c.getAllValues().stream().map(FeaturePermission::getPermissionCode).toList();
        assertThat(codes).contains("MFG_PRODUCTION:READ","MFG_PRODUCTION:RELEASE","MFG_PRODUCTION:APPROVE","MFG_PRODUCTION:REJECT","MFG_PRODUCTION:CANCEL");
    }

    @Test @DisplayName("MFG_OPERATIONS gets COMPLETE CONSUME RESERVE actions")
    void testMfgOperationsHasConsumeAndComplete() {
        setupMocks();
        featureBootstrap.run();
        ArgumentCaptor<FeaturePermission> c = ArgumentCaptor.forClass(FeaturePermission.class);
        verify(featurePermissionRepository, atLeastOnce()).save(c.capture());
        List<String> codes = c.getAllValues().stream().map(FeaturePermission::getPermissionCode).toList();
        assertThat(codes).contains("MFG_OPERATIONS:READ","MFG_OPERATIONS:COMPLETE","MFG_OPERATIONS:CONSUME","MFG_OPERATIONS:RESERVE","MFG_OPERATIONS:CANCEL");
    }
}
