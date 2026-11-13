package com.erp.workflow.service;

import com.erp.workflow.dto.request.CreateOrgWorkflowTemplateRequest;
import com.erp.workflow.dto.request.ProvisionCompanyWorkflowRequest;
import com.erp.workflow.dto.request.UpdateOrgWorkflowTemplateRequest;
import com.erp.workflow.dto.response.OrgWorkflowProvisionResultDto;
import com.erp.workflow.dto.response.OrgWorkflowTemplateResponse;
import com.erp.workflow.entity.*;
import com.erp.workflow.enums.ApproverType;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.exception.ResourceNotFoundException;
import com.erp.workflow.repository.*;
import com.erp.workflow.security.CurrentUserContext;
import com.erp.workflow.service.impl.OrganizationWorkflowTemplateServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationWorkflowTemplateServiceTest {

    @Mock
    private OrganizationWorkflowTemplateRepository templateRepository;
    @Mock
    private OrgWorkflowTemplateStageRepository templateStageRepository;
    @Mock
    private OrgWorkflowTemplateApproverRepository templateApproverRepository;
    @Mock
    private OrgWorkflowTemplateTransitionRepository templateTransitionRepository;
    @Mock
    private OrgWorkflowTemplateSlaRepository templateSlaRepository;
    @Mock
    private OrgWorkflowProvisionLogRepository provisionLogRepository;

    @Mock
    private WorkflowDefinitionRepository definitionRepository;
    @Mock
    private WorkflowStageRepository stageRepository;
    @Mock
    private WorkflowApproverRepository approverRepository;
    @Mock
    private WorkflowTransitionRepository transitionRepository;
    @Mock
    private WorkflowSlaRepository slaRepository;

    @InjectMocks
    private OrganizationWorkflowTemplateServiceImpl templateService;

    private UUID organizationId;
    private UUID companyAId;
    private UUID companyBId;
    private UUID templateId;
    private OrganizationWorkflowTemplate sampleTemplate;

    @BeforeEach
    void setUp() {
        CurrentUserContext.clear();
        organizationId = UUID.randomUUID();
        companyAId = UUID.randomUUID();
        companyBId = UUID.randomUUID();
        templateId = UUID.randomUUID();

        // Establish current security context for tests
        CurrentUserContext.setUserId(UUID.randomUUID());
        CurrentUserContext.setUsername("org_admin");
        CurrentUserContext.setOrganizationId(organizationId);
        CurrentUserContext.setUserRole("ROLE_OWNER");

        sampleTemplate = OrganizationWorkflowTemplate.builder()
                .id(templateId)
                .organizationId(organizationId)
                .templateCode("DEFAULT_APPROVAL")
                .templateName("Organization Default Approval")
                .moduleName("ACCOUNT")
                .documentType("INVOICE")
                .version(1)
                .isActive(true)
                .isDefault(true)
                .stages(new ArrayList<>())
                .transitions(new ArrayList<>())
                .build();

        OrgWorkflowTemplateStage stage = OrgWorkflowTemplateStage.builder()
                .id(UUID.randomUUID())
                .template(sampleTemplate)
                .stageCode("FINANCE_APPROVAL")
                .stageName("Finance Approval")
                .sequenceNo(1)
                .executionType(WorkflowExecutionType.SEQUENTIAL)
                .rejectionAction(WorkflowRejectionAction.REJECT_DOCUMENT)
                .minimumApprovalsRequired(1)
                .approvers(new ArrayList<>())
                .build();

        OrgWorkflowTemplateApprover approver = OrgWorkflowTemplateApprover.builder()
                .id(UUID.randomUUID())
                .stage(stage)
                .approverType(ApproverType.ROLE)
                .roleName("FINANCE_MANAGER")
                .approvalOrder(1)
                .isRequired(true)
                .build();

        stage.getApprovers().add(approver);
        sampleTemplate.getStages().add(stage);

        lenient().when(templateStageRepository.save(any(OrgWorkflowTemplateStage.class)))
                .thenAnswer(inv -> {
                    OrgWorkflowTemplateStage s = inv.getArgument(0);
                    if (s.getId() == null) s.setId(UUID.randomUUID());
                    return s;
                });

        lenient().when(stageRepository.save(any(WorkflowStage.class)))
                .thenAnswer(inv -> {
                    WorkflowStage st = inv.getArgument(0);
                    if (st.getId() == null) st.setId(UUID.randomUUID());
                    return st;
                });

        lenient().when(approverRepository.save(any(WorkflowApprover.class)))
                .thenAnswer(inv -> {
                    WorkflowApprover a = inv.getArgument(0);
                    if (a.getId() == null) a.setId(UUID.randomUUID());
                    return a;
                });

        lenient().when(templateApproverRepository.findByStage_IdAndIsDeletedFalseOrderByApprovalOrderAsc(any()))
                .thenReturn(sampleTemplate.getStages().get(0).getApprovers());
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    @DisplayName("1. Organization creates a Default Workflow Template successfully")
    void testCreateTemplate_Success() {
        CreateOrgWorkflowTemplateRequest request = CreateOrgWorkflowTemplateRequest.builder()
                .organizationId(organizationId)
                .templateCode("DEFAULT_APPROVAL")
                .templateName("Organization Default Approval")
                .moduleName("ACCOUNT")
                .documentType("INVOICE")
                .isDefault(true)
                .stages(List.of(
                        CreateOrgWorkflowTemplateRequest.StageRequest.builder()
                                .stageCode("FINANCE_APPROVAL")
                                .stageName("Finance Approval")
                                .sequenceNo(1)
                                .executionType(WorkflowExecutionType.SEQUENTIAL)
                                .rejectionAction(WorkflowRejectionAction.REJECT_DOCUMENT)
                                .minimumApprovalsRequired(1)
                                .approvers(List.of(
                                        CreateOrgWorkflowTemplateRequest.ApproverRequest.builder()
                                                .approverType(ApproverType.ROLE)
                                                .roleName("FINANCE_MANAGER")
                                                .approvalOrder(1)
                                                .isRequired(true)
                                                .build()
                                ))
                                .build()
                ))
                .build();

        when(templateRepository.existsByOrganizationIdAndTemplateCodeAndVersionAndIsDeletedFalse(
                organizationId, "DEFAULT_APPROVAL", 1)).thenReturn(false);
        when(templateRepository.save(any(OrganizationWorkflowTemplate.class))).thenReturn(sampleTemplate);
        when(templateStageRepository.findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(sampleTemplate.getId()))
                .thenReturn(sampleTemplate.getStages());
        when(templateTransitionRepository.findByTemplate_IdAndIsDeletedFalse(sampleTemplate.getId()))
                .thenReturn(Collections.emptyList());
        when(definitionRepository.findByTemplateIdAndIsDeletedFalse(sampleTemplate.getId()))
                .thenReturn(Collections.emptyList());

        OrgWorkflowTemplateResponse response = templateService.createTemplate(organizationId, request);

        assertNotNull(response);
        assertEquals("DEFAULT_APPROVAL", response.getTemplateCode());
        assertEquals("ACCOUNT", response.getModuleName());
        assertEquals(1, response.getVersion());
        assertTrue(response.getIsDefault());
        verify(templateRepository, atLeastOnce()).save(any(OrganizationWorkflowTemplate.class));
    }

    @Test
    @DisplayName("2. Existing companies receive the workflow instance")
    void testProvisionCompanyWorkflow_CreatesDefinition() {
        UUID roleId = UUID.randomUUID();
        Map<String, UUID> roleMap = Map.of("FINANCE_MANAGER", roleId);

        ProvisionCompanyWorkflowRequest request = ProvisionCompanyWorkflowRequest.builder()
                .organizationId(organizationId)
                .templateId(templateId)
                .companyId(companyAId)
                .roleNameToIdMap(roleMap)
                .forceUpdateCustomized(false)
                .build();

        when(templateRepository.findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId))
                .thenReturn(Optional.of(sampleTemplate));
        when(definitionRepository.findFirstByCompanyIdAndTemplateIdAndIsDeletedFalseOrderByVersionDesc(companyAId, templateId))
                .thenReturn(Optional.empty());
        when(definitionRepository.findMaxVersionByCompanyIdAndWorkflowCode(companyAId, "DEFAULT_APPROVAL"))
                .thenReturn(0);
        when(definitionRepository.findActiveByDocumentType(companyAId, "INVOICE"))
                .thenReturn(Collections.emptyList());

        when(definitionRepository.save(any(WorkflowDefinition.class))).thenAnswer(inv -> {
            WorkflowDefinition def = inv.getArgument(0);
            def.setId(UUID.randomUUID());
            return def;
        });

        when(templateStageRepository.findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(templateId))
                .thenReturn(sampleTemplate.getStages());

        OrgWorkflowProvisionResultDto result = templateService.provisionToCompany(request);

        assertNotNull(result);
        assertEquals(1, result.getProvisionedCount());
        assertEquals(0, result.getFailedCount());
        assertEquals(0, result.getSkippedCustomizedCount());

        verify(provisionLogRepository).save(any(OrgWorkflowProvisionLog.class));
        verify(definitionRepository).save(any(WorkflowDefinition.class));
    }

    @Test
    @DisplayName("3. Newly created companies automatically receive the workflow (with role mapping)")
    void testNewlyCreatedCompany_AutoReceivesWorkflowWithResolvedRoles() {
        UUID financeRoleId = UUID.randomUUID();
        Map<String, UUID> roleMap = Map.of("FINANCE_MANAGER", financeRoleId);

        ProvisionCompanyWorkflowRequest request = ProvisionCompanyWorkflowRequest.builder()
                .organizationId(organizationId)
                .templateId(templateId)
                .companyId(companyBId)
                .roleNameToIdMap(roleMap)
                .build();

        when(templateRepository.findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId))
                .thenReturn(Optional.of(sampleTemplate));
        when(definitionRepository.findFirstByCompanyIdAndTemplateIdAndIsDeletedFalseOrderByVersionDesc(companyBId, templateId))
                .thenReturn(Optional.empty());
        when(definitionRepository.findMaxVersionByCompanyIdAndWorkflowCode(companyBId, "DEFAULT_APPROVAL"))
                .thenReturn(0);
        when(definitionRepository.findActiveByDocumentType(companyBId, "INVOICE"))
                .thenReturn(Collections.emptyList());

        when(definitionRepository.save(any(WorkflowDefinition.class))).thenAnswer(inv -> {
            WorkflowDefinition def = inv.getArgument(0);
            def.setId(UUID.randomUUID());
            return def;
        });

        when(templateStageRepository.findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(templateId))
                .thenReturn(sampleTemplate.getStages());

        when(stageRepository.save(any(WorkflowStage.class))).thenAnswer(inv -> {
            WorkflowStage st = inv.getArgument(0);
            st.setId(UUID.randomUUID());
            return st;
        });

        when(templateApproverRepository.findByStage_IdAndIsDeletedFalseOrderByApprovalOrderAsc(any()))
                .thenReturn(sampleTemplate.getStages().get(0).getApprovers());

        when(approverRepository.save(any(WorkflowApprover.class))).thenAnswer(inv -> {
            WorkflowApprover app = inv.getArgument(0);
            // Verify dynamic role mapping resolved the company role ID
            assertEquals(financeRoleId, app.getRoleId());
            assertEquals("FINANCE_MANAGER", app.getRoleName());
            return app;
        });

        OrgWorkflowProvisionResultDto result = templateService.provisionToCompany(request);
        assertEquals(1, result.getProvisionedCount());
    }

    @Test
    @DisplayName("4. Organization updates Default Workflow - increments version")
    void testUpdateTemplate_IncrementsVersion() {
        UpdateOrgWorkflowTemplateRequest updateRequest = UpdateOrgWorkflowTemplateRequest.builder()
                .templateName("Organization Default Approval V2")
                .description("Updated SLA and description")
                .build();

        when(templateRepository.findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId))
                .thenReturn(Optional.of(sampleTemplate));
        when(templateRepository.save(any(OrganizationWorkflowTemplate.class))).thenReturn(sampleTemplate);

        when(templateStageRepository.findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(templateId))
                .thenReturn(sampleTemplate.getStages());
        when(templateTransitionRepository.findByTemplate_IdAndIsDeletedFalse(templateId))
                .thenReturn(Collections.emptyList());
        when(definitionRepository.findByTemplateIdAndIsDeletedFalse(templateId))
                .thenReturn(Collections.emptyList());

        OrgWorkflowTemplateResponse response = templateService.updateTemplate(organizationId, templateId, updateRequest);

        assertNotNull(response);
        assertEquals(2, sampleTemplate.getVersion());
        assertEquals("Organization Default Approval V2", sampleTemplate.getTemplateName());
    }

    @Test
    @DisplayName("5. All eligible company workflows receive the updated version upon propagation")
    void testPropagateTemplate_UpdatesEligibleCompanies() {
        sampleTemplate.setVersion(2);

        WorkflowDefinition companyWf = WorkflowDefinition.builder()
                .id(UUID.randomUUID())
                .companyId(companyAId)
                .organizationId(organizationId)
                .templateId(templateId)
                .templateVersion(1)
                .version(1)
                .isCustomized(false)
                .isActive(true)
                .build();

        when(templateRepository.findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId))
                .thenReturn(Optional.of(sampleTemplate));
        when(definitionRepository.findByTemplateIdAndIsDeletedFalse(templateId))
                .thenReturn(List.of(companyWf));

        when(definitionRepository.findFirstByCompanyIdAndTemplateIdAndIsDeletedFalseOrderByVersionDesc(companyAId, templateId))
                .thenReturn(Optional.of(companyWf));
        when(definitionRepository.findMaxVersionByCompanyIdAndWorkflowCode(companyAId, "DEFAULT_APPROVAL"))
                .thenReturn(1);
        when(definitionRepository.findActiveByDocumentType(companyAId, "INVOICE"))
                .thenReturn(Collections.emptyList());

        when(definitionRepository.save(any(WorkflowDefinition.class))).thenAnswer(inv -> {
            WorkflowDefinition def = inv.getArgument(0);
            if (def.getId() == null) def.setId(UUID.randomUUID());
            return def;
        });

        when(templateStageRepository.findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(templateId))
                .thenReturn(sampleTemplate.getStages());

        OrgWorkflowProvisionResultDto result = templateService.propagateTemplate(
                organizationId, templateId, null, false);

        assertEquals(1, result.getProvisionedCount());
        assertFalse(companyWf.getIsActive()); // Old definition deactivated
    }

    @Test
    @DisplayName("6. Customized company workflows are preserved during propagation")
    void testPropagateTemplate_PreservesCustomizedWorkflows() {
        sampleTemplate.setVersion(2);

        WorkflowDefinition customizedWf = WorkflowDefinition.builder()
                .id(UUID.randomUUID())
                .companyId(companyAId)
                .organizationId(organizationId)
                .templateId(templateId)
                .templateVersion(1)
                .version(1)
                .isCustomized(true) // Company made local edits!
                .isActive(true)
                .build();

        when(templateRepository.findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId))
                .thenReturn(Optional.of(sampleTemplate));
        when(definitionRepository.findFirstByCompanyIdAndTemplateIdAndIsDeletedFalseOrderByVersionDesc(companyAId, templateId))
                .thenReturn(Optional.of(customizedWf));

        // When forceUpdateCustomized = false
        OrgWorkflowProvisionResultDto result = templateService.propagateTemplate(
                organizationId, templateId, List.of(companyAId), false);

        assertEquals(0, result.getProvisionedCount());
        assertEquals(1, result.getSkippedCustomizedCount());
        assertTrue(customizedWf.getIsActive()); // Kept active on v1
    }

    @Test
    @DisplayName("7. Force update applies updates to customized company workflows if authorized")
    void testPropagateTemplate_ForceUpdateCustomizedOverridesWhenAuthorized() {
        sampleTemplate.setVersion(2);

        WorkflowDefinition customizedWf = WorkflowDefinition.builder()
                .id(UUID.randomUUID())
                .companyId(companyAId)
                .organizationId(organizationId)
                .templateId(templateId)
                .templateVersion(1)
                .version(1)
                .isCustomized(true)
                .isActive(true)
                .build();

        when(templateRepository.findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId))
                .thenReturn(Optional.of(sampleTemplate));
        when(definitionRepository.findFirstByCompanyIdAndTemplateIdAndIsDeletedFalseOrderByVersionDesc(companyAId, templateId))
                .thenReturn(Optional.of(customizedWf));
        when(definitionRepository.findMaxVersionByCompanyIdAndWorkflowCode(companyAId, "DEFAULT_APPROVAL"))
                .thenReturn(1);
        when(definitionRepository.findActiveByDocumentType(companyAId, "INVOICE"))
                .thenReturn(Collections.emptyList());

        when(definitionRepository.save(any(WorkflowDefinition.class))).thenAnswer(inv -> {
            WorkflowDefinition def = inv.getArgument(0);
            if (def.getId() == null) def.setId(UUID.randomUUID());
            return def;
        });

        when(templateStageRepository.findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(templateId))
                .thenReturn(sampleTemplate.getStages());

        // When forceUpdateCustomized = true
        OrgWorkflowProvisionResultDto result = templateService.propagateTemplate(
                organizationId, templateId, List.of(companyAId), true);

        assertEquals(1, result.getProvisionedCount());
        assertEquals(0, result.getSkippedCustomizedCount());
    }

    @Test
    @DisplayName("8. Cross-organization workflow access is prevented (data isolation)")
    void testCrossOrganizationAccess_Prevented() {
        UUID otherOrgId = UUID.randomUUID();

        // Security context is organizationId, attempting to query otherOrgId fails
        assertThrows(WorkflowValidationException.class, () ->
                templateService.getTemplateById(otherOrgId, templateId));
    }

    @Test
    @DisplayName("9. Duplicate workflow assignments are prevented (idempotence)")
    void testDuplicateWorkflowAssignment_Prevented() {
        ProvisionCompanyWorkflowRequest request = ProvisionCompanyWorkflowRequest.builder()
                .organizationId(organizationId)
                .templateId(templateId)
                .companyId(companyAId)
                .forceUpdateCustomized(false)
                .build();

        WorkflowDefinition existingUpToDate = WorkflowDefinition.builder()
                .id(UUID.randomUUID())
                .companyId(companyAId)
                .organizationId(organizationId)
                .templateId(templateId)
                .templateVersion(1)
                .version(1)
                .isCustomized(false)
                .isActive(true)
                .build();

        when(templateRepository.findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId))
                .thenReturn(Optional.of(sampleTemplate));
        when(definitionRepository.findFirstByCompanyIdAndTemplateIdAndIsDeletedFalseOrderByVersionDesc(companyAId, templateId))
                .thenReturn(Optional.of(existingUpToDate));

        OrgWorkflowProvisionResultDto result = templateService.provisionToCompany(request);

        assertNotNull(result);
        assertEquals(1, result.getProvisionedCount()); // Idempotent success
        // Definition should not be recreated since it is already up-to-date
        verify(definitionRepository, never()).findMaxVersionByCompanyIdAndWorkflowCode(any(), any());
    }

    @Test
    @DisplayName("10. Missing approver roles and provisioning failures handled safely")
    void testMissingApproverRole_HandledSafelyWithFallback() {
        // Empty role map — role "FINANCE_MANAGER" does not exist in target company
        Map<String, UUID> emptyRoleMap = Collections.emptyMap();

        ProvisionCompanyWorkflowRequest request = ProvisionCompanyWorkflowRequest.builder()
                .organizationId(organizationId)
                .templateId(templateId)
                .companyId(companyAId)
                .roleNameToIdMap(emptyRoleMap)
                .build();

        when(templateRepository.findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId))
                .thenReturn(Optional.of(sampleTemplate));
        when(definitionRepository.findFirstByCompanyIdAndTemplateIdAndIsDeletedFalseOrderByVersionDesc(companyAId, templateId))
                .thenReturn(Optional.empty());
        when(definitionRepository.findMaxVersionByCompanyIdAndWorkflowCode(companyAId, "DEFAULT_APPROVAL"))
                .thenReturn(0);
        when(definitionRepository.findActiveByDocumentType(companyAId, "INVOICE"))
                .thenReturn(Collections.emptyList());

        when(definitionRepository.save(any(WorkflowDefinition.class))).thenAnswer(inv -> {
            WorkflowDefinition def = inv.getArgument(0);
            def.setId(UUID.randomUUID());
            return def;
        });

        when(templateStageRepository.findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(templateId))
                .thenReturn(sampleTemplate.getStages());

        when(stageRepository.save(any(WorkflowStage.class))).thenAnswer(inv -> {
            WorkflowStage st = inv.getArgument(0);
            st.setId(UUID.randomUUID());
            return st;
        });

        when(templateApproverRepository.findByStage_IdAndIsDeletedFalseOrderByApprovalOrderAsc(any()))
                .thenReturn(sampleTemplate.getStages().get(0).getApprovers());

        when(approverRepository.save(any(WorkflowApprover.class))).thenAnswer(inv -> {
            WorkflowApprover app = inv.getArgument(0);
            // roleId is null because role was missing, but roleName is safely preserved as fallback
            assertNull(app.getRoleId());
            assertEquals("FINANCE_MANAGER", app.getRoleName());
            return app;
        });

        OrgWorkflowProvisionResultDto result = templateService.provisionToCompany(request);
        assertEquals(1, result.getProvisionedCount());
    }

    @Test
    @DisplayName("11. Concurrent provisioning recovers gracefully from DataIntegrityViolationException")
    void testConcurrentProvisioning_RecoversFromDataIntegrityViolation() {
        ProvisionCompanyWorkflowRequest request = ProvisionCompanyWorkflowRequest.builder()
                .organizationId(organizationId)
                .templateId(templateId)
                .companyId(companyAId)
                .build();

        WorkflowDefinition concurrentDef = WorkflowDefinition.builder()
                .id(UUID.randomUUID())
                .companyId(companyAId)
                .organizationId(organizationId)
                .templateId(templateId)
                .templateVersion(1)
                .version(1)
                .isCustomized(false)
                .isActive(true)
                .build();

        when(templateRepository.findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId))
                .thenReturn(Optional.of(sampleTemplate));
        // First check sees nothing
        when(definitionRepository.findFirstByCompanyIdAndTemplateIdAndIsDeletedFalseOrderByVersionDesc(companyAId, templateId))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(concurrentDef)); // Second check after collision finds concurrent def
        when(definitionRepository.findMaxVersionByCompanyIdAndWorkflowCode(companyAId, "DEFAULT_APPROVAL"))
                .thenReturn(0);
        when(definitionRepository.findActiveByDocumentType(companyAId, "INVOICE"))
                .thenReturn(Collections.emptyList());

        // Simulate concurrent unique constraint collision
        when(definitionRepository.save(any(WorkflowDefinition.class)))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("Unique constraint violation"));

        OrgWorkflowProvisionResultDto result = templateService.provisionToCompany(request);

        assertNotNull(result);
        assertEquals(1, result.getProvisionedCount());
        assertEquals(0, result.getFailedCount());
    }
}
