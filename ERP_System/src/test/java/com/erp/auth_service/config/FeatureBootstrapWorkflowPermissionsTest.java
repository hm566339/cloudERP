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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeatureBootstrapWorkflowPermissionsTest {

    @Mock
    private FeatureRepository featureRepository;

    @Mock
    private FeaturePermissionRepository featurePermissionRepository;

    @InjectMocks
    private FeatureBootstrap featureBootstrap;

    @Test
    @DisplayName("FeatureBootstrap registers WORKFLOW_DEFINITIONS feature with ACTIVATE and DEACTIVATE permissions")
    void testBootstrapRegistersWorkflowDefinitionsWithActivateAndDeactivate() {
        when(featureRepository.findByCodeIgnoreCase(anyString())).thenAnswer(invocation -> {
            String code = invocation.getArgument(0);
            return Optional.of(Feature.builder()
                    .code(code.toUpperCase())
                    .name(code)
                    .moduleName("WORKFLOW")
                    .active(true)
                    .build());
        });

        when(featurePermissionRepository.findByPermissionCodeIgnoreCase(anyString()))
                .thenReturn(Optional.empty());

        featureBootstrap.run();

        ArgumentCaptor<FeaturePermission> permissionCaptor = ArgumentCaptor.forClass(FeaturePermission.class);
        verify(featurePermissionRepository, atLeastOnce()).save(permissionCaptor.capture());

        List<String> permissionCodes = permissionCaptor.getAllValues().stream()
                .map(FeaturePermission::getPermissionCode)
                .toList();

        assertThat(permissionCodes).contains(
                "WORKFLOW_DEFINITIONS:READ",
                "WORKFLOW_DEFINITIONS:CREATE",
                "WORKFLOW_DEFINITIONS:UPDATE",
                "WORKFLOW_DEFINITIONS:WRITE",
                "WORKFLOW_DEFINITIONS:DELETE",
                "WORKFLOW_DEFINITIONS:ACTIVATE",
                "WORKFLOW_DEFINITIONS:DEACTIVATE"
        );
    }
}
