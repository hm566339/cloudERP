package com.erp.workflow.service;

import com.erp.workflow.dto.request.CreatePlatformWorkflowTemplateRequest;
import com.erp.workflow.dto.request.RolloutPlatformTemplateRequest;
import com.erp.workflow.dto.request.UpdatePlatformWorkflowTemplateRequest;
import com.erp.workflow.dto.response.PlatformWorkflowRolloutResultDto;
import com.erp.workflow.dto.response.PlatformWorkflowTemplateResponse;
import com.erp.workflow.entity.*;
import com.erp.workflow.enums.ApproverType;
import com.erp.workflow.enums.PlatformRolloutMode;
import com.erp.workflow.enums.WorkflowActionType;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import com.erp.workflow.repository.*;
import com.erp.workflow.security.CurrentUserContext;
import com.erp.workflow.security.sso.SsoService;
import com.erp.workflow.service.impl.PlatformWorkflowTemplateServiceImpl;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformWorkflowTemplateServiceTest {

    @Mock
    private PlatformWorkflowTemplateRepository platformTemplateRepository;
    @Mock
    private PlatformWorkflowTemplateStageRepository platformStageRepository;
    @Mock
    private PlatformWorkflowTemplateApproverRepository platformApproverRepository;
    @Mock
    private PlatformWorkflowTemplateTransitionRepository platformTransitionRepository;
    @Mock
    private PlatformWorkflowTemplateSlaRepository platformSlaRepository;
    @Mock
    private PlatformWorkflowRolloutLogRepository rolloutLogRepository;

    @Mock
    private OrganizationWorkflowTemplateRepository orgTemplateRepository;
    @Mock
    private OrgWorkflowTemplateStageRepository orgStageRepository;
    @Mock
    private OrgWorkflowTemplateApproverRepository orgApproverRepository;
    @Mock
    private OrgWorkflowTemplateTransitionRepository orgTransitionRepository;
    @Mock
    private OrgWorkflowTemplateSlaRepository orgSlaRepository;
    @Mock
    private OrganizationWorkflowTemplateService orgTemplateService;
    @Mock
    private SsoService ssoService;
    @Mock
    private WorkflowDefinitionRepository definitionRepository;

    @InjectMocks
    private PlatformWorkflowTemplateServiceImpl service;

    private UUID platformTemplateId;
    private PlatformWorkflowTemplate platformTemplate;

    @BeforeEach
    void setUp() {
        platformTemplateId = UUID.randomUUID();
        platformTemplate = PlatformWorkflowTemplate.builder()
                .id(platformTemplateId)
                .templateCode("FISCAL_YEAR_GLOBAL")
                .templateName("Global Fiscal Year Workflow")
                .moduleName("ACCOUNT")
                .documentType("FISCAL_YEAR")
                .version(1)
                .isActive(true)
                .isDefault(true)
                .build();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Level 1: Create global platform workflow template successfully")
    void testCreatePlatformTemplate() {
        CreatePlatformWorkflowTemplateRequest req = CreatePlatformWorkflowTemplateRequest.builder()
                .templateCode("FISCAL_YEAR_GLOBAL")
                .templateName("Global Fiscal Year Workflow")
                .moduleName("ACCOUNT")
                .documentType("FISCAL_YEAR")
                .stages(List.of(
                        CreatePlatformWorkflowTemplateRequest.StageRequest.builder()
                                .stageCode("REVIEW")
                                .stageName("Initial Review")
                                .sequenceNo(1)
                                .executionType(WorkflowExecutionType.SEQUENTIAL)
                                .minimumApprovalsRequired(1)
                                .rejectionAction(WorkflowRejectionAction.REJECT_DOCUMENT)
                                .approvers(List.of(
                                        CreatePlatformWorkflowTemplateRequest.ApproverRequest.builder()
                                                .approverType(ApproverType.ROLE)
                                                .roleName("ACCOUNTANT")
                                                .build()
                                ))
                                .build()
                ))
                .transitions(List.of(
                        CreatePlatformWorkflowTemplateRequest.TransitionRequest.builder()
                                .actionType(WorkflowActionType.SUBMIT)
                                .targetStageCode("REVIEW")
                                .build()
                ))
                .build();

        when(platformTemplateRepository.existsByTemplateCodeAndVersionAndIsDeletedFalse(anyString(), anyInt()))
                .thenReturn(false);
        when(platformTemplateRepository.save(any(PlatformWorkflowTemplate.class)))
                .thenAnswer(inv -> {
                    PlatformWorkflowTemplate t = inv.getArgument(0);
                    t.setId(platformTemplateId);
                    return t;
                });
        when(platformStageRepository.save(any(PlatformWorkflowTemplateStage.class)))
                .thenAnswer(inv -> {
                    PlatformWorkflowTemplateStage s = inv.getArgument(0);
                    s.setId(UUID.randomUUID());
                    return s;
                });

        PlatformWorkflowTemplateResponse resp = service.createTemplate(req);

        assertNotNull(resp);
        assertEquals("FISCAL_YEAR_GLOBAL", resp.getTemplateCode());
        assertEquals("Global Fiscal Year Workflow", resp.getTemplateName());
        assertEquals(1, resp.getVersion());
        assertTrue(resp.getIsActive());
        assertTrue(resp.getIsDefault());

        verify(platformTemplateRepository).save(any(PlatformWorkflowTemplate.class));
        verify(platformStageRepository).save(any(PlatformWorkflowTemplateStage.class));
        verify(platformApproverRepository).save(any(PlatformWorkflowTemplateApprover.class));
        verify(platformTransitionRepository).save(any(PlatformWorkflowTemplateTransition.class));
    }

    @Test
    @DisplayName("Level 2: Provision platform default templates to new organization (idempotent)")
    void testProvisionTemplatesToOrganization() {
        UUID organizationId = UUID.randomUUID();

        when(platformTemplateRepository.findByIsActiveTrueAndIsDefaultTrueAndIsDeletedFalse())
                .thenReturn(List.of(platformTemplate));
        when(orgTemplateRepository.findByOrganizationIdAndPlatformTemplateIdAndIsDeletedFalse(organizationId, platformTemplateId))
                .thenReturn(Optional.empty());

        PlatformWorkflowTemplateStage pStage = PlatformWorkflowTemplateStage.builder()
                .id(UUID.randomUUID())
                .template(platformTemplate)
                .stageCode("REVIEW")
                .stageName("Review")
                .sequenceNo(1)
                .build();
        when(platformStageRepository.findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(platformTemplateId))
                .thenReturn(List.of(pStage));

        when(orgTemplateRepository.save(any(OrganizationWorkflowTemplate.class)))
                .thenAnswer(inv -> {
                    OrganizationWorkflowTemplate ot = inv.getArgument(0);
                    ot.setId(UUID.randomUUID());
                    return ot;
                });
        when(orgStageRepository.save(any(OrgWorkflowTemplateStage.class)))
                .thenAnswer(inv -> {
                    OrgWorkflowTemplateStage os = inv.getArgument(0);
                    os.setId(UUID.randomUUID());
                    return os;
                });

        int count = service.provisionTemplatesToOrganization(organizationId);

        assertEquals(1, count);
        verify(orgTemplateRepository).save(argThat(ot ->
                ot.getOrganizationId().equals(organizationId) &&
                ot.getPlatformTemplateId().equals(platformTemplateId) &&
                ot.getPlatformTemplateVersion().equals(1) &&
                !ot.getIsCustomized() // is_customized should be false initially
        ));
    }

    @Test
    @DisplayName("Rollout Mode: NON_CUSTOMIZED preserves customized organization workflows")
    void testRolloutNonCustomizedPreservesCustomized() {
        OrganizationWorkflowTemplate customizedOrg = OrganizationWorkflowTemplate.builder()
                .id(UUID.randomUUID())
                .organizationId(UUID.randomUUID())
                .platformTemplateId(platformTemplateId)
                .platformTemplateVersion(1)
                .version(2)
                .isCustomized(true) // CUSTOMIZED by org admin!
                .templateCode("FISCAL_YEAR_GLOBAL")
                .templateName("Custom Org Fiscal Year")
                .build();

        OrganizationWorkflowTemplate defaultOrg = OrganizationWorkflowTemplate.builder()
                .id(UUID.randomUUID())
                .organizationId(UUID.randomUUID())
                .platformTemplateId(platformTemplateId)
                .platformTemplateVersion(1)
                .version(1)
                .isCustomized(false) // UNTOUCHED
                .templateCode("FISCAL_YEAR_GLOBAL")
                .templateName("Global Fiscal Year Workflow")
                .build();

        when(platformTemplateRepository.findByIdAndIsDeletedFalse(platformTemplateId))
                .thenReturn(Optional.of(platformTemplate));
        when(orgTemplateRepository.findByPlatformTemplateIdAndIsDeletedFalse(platformTemplateId))
                .thenReturn(List.of(customizedOrg, defaultOrg));
        when(orgTemplateRepository.save(any(OrganizationWorkflowTemplate.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        RolloutPlatformTemplateRequest rolloutReq = RolloutPlatformTemplateRequest.builder()
                .rolloutMode(PlatformRolloutMode.NON_CUSTOMIZED)
                .propagateToCompanies(true)
                .build();

        PlatformWorkflowRolloutResultDto result = service.rolloutTemplate(platformTemplateId, rolloutReq);

        assertNotNull(result);
        assertEquals(2, result.getTotalOrganizationsTargeted());
        assertEquals(1, result.getOrganizationsUpdated());
        assertEquals(1, result.getOrganizationsSkippedCustomized());

        // customizedOrg was NOT saved with new platform template
        verify(orgTemplateRepository, never()).save(customizedOrg);
        // defaultOrg WAS updated
        verify(orgTemplateRepository).save(defaultOrg);
    }

    @Test
    @DisplayName("Rollout Mode: FORCE_ALL updates all organizations including customized ones")
    void testRolloutForceAllUpdatesAll() {
        OrganizationWorkflowTemplate customizedOrg = OrganizationWorkflowTemplate.builder()
                .id(UUID.randomUUID())
                .organizationId(UUID.randomUUID())
                .platformTemplateId(platformTemplateId)
                .platformTemplateVersion(1)
                .version(2)
                .isCustomized(true)
                .templateCode("FISCAL_YEAR_GLOBAL")
                .templateName("Custom Org Fiscal Year")
                .build();

        when(platformTemplateRepository.findByIdAndIsDeletedFalse(platformTemplateId))
                .thenReturn(Optional.of(platformTemplate));
        when(orgTemplateRepository.findByPlatformTemplateIdAndIsDeletedFalse(platformTemplateId))
                .thenReturn(List.of(customizedOrg));
        when(orgTemplateRepository.save(any(OrganizationWorkflowTemplate.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        RolloutPlatformTemplateRequest rolloutReq = RolloutPlatformTemplateRequest.builder()
                .rolloutMode(PlatformRolloutMode.FORCE_ALL)
                .propagateToCompanies(true)
                .build();

        PlatformWorkflowRolloutResultDto result = service.rolloutTemplate(platformTemplateId, rolloutReq);

        assertNotNull(result);
        assertEquals(1, result.getTotalOrganizationsTargeted());
        assertEquals(1, result.getOrganizationsUpdated());
        assertEquals(0, result.getOrganizationsSkippedCustomized());

        verify(orgTemplateRepository).save(argThat(ot ->
                ot.getId().equals(customizedOrg.getId()) &&
                !ot.getIsCustomized() // Customization flag reset on force update
        ));
    }
}

