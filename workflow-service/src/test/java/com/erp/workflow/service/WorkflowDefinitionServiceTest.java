package com.erp.workflow.service;

import com.erp.workflow.dto.request.CreateWorkflowDefinitionRequest;
import com.erp.workflow.dto.response.WorkflowDefinitionResponse;
import com.erp.workflow.entity.*;
import com.erp.workflow.enums.WorkflowActionType;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import com.erp.workflow.repository.*;
import com.erp.workflow.service.impl.WorkflowDefinitionServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowDefinitionServiceTest {

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
    private WorkflowDefinitionServiceImpl definitionService;

    @Test
    void testCreateDefinition_Success() {
        UUID companyId = UUID.randomUUID();
        UUID defId = UUID.randomUUID();

        CreateWorkflowDefinitionRequest request = CreateWorkflowDefinitionRequest.builder()
                .companyId(companyId)
                .workflowCode("TEST_WF")
                .workflowName("Test Workflow")
                .moduleName("ACCOUNT")
                .documentType("FISCAL_YEAR")
                .version(1)
                .isActive(true)
                .stages(List.of(
                        CreateWorkflowDefinitionRequest.StageRequest.builder()
                                .stageCode("REVIEW")
                                .stageName("Review Stage")
                                .sequenceNo(1)
                                .executionType(WorkflowExecutionType.SEQUENTIAL)
                                .rejectionAction(WorkflowRejectionAction.REJECT_DOCUMENT)
                                .build()
                ))
                .build();

        WorkflowDefinition savedDef = WorkflowDefinition.builder()
                .id(defId)
                .companyId(companyId)
                .workflowCode("TEST_WF")
                .workflowName("Test Workflow")
                .moduleName("ACCOUNT")
                .documentType("FISCAL_YEAR")
                .version(1)
                .isActive(true)
                .build();

        when(definitionRepository.existsByCompanyIdAndWorkflowCodeAndVersionAndIsDeletedFalse(companyId, "TEST_WF", 1))
                .thenReturn(false);
        when(definitionRepository.save(any(WorkflowDefinition.class))).thenReturn(savedDef);
        when(stageRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(defId, companyId))
                .thenReturn(Optional.of(savedDef));
        when(stageRepository.findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(defId))
                .thenReturn(Collections.emptyList());
        when(transitionRepository.findByWorkflowDefinitionIdAndIsDeletedFalse(defId))
                .thenReturn(Collections.emptyList());

        WorkflowDefinitionResponse response = definitionService.createDefinition(request);

        assertNotNull(response);
        assertEquals("TEST_WF", response.getWorkflowCode());
        assertEquals("ACCOUNT", response.getModuleName());
        verify(definitionRepository, atLeastOnce()).save(any(WorkflowDefinition.class));
    }

    @Test
    void testGetActiveDefinitionByDocumentType_Success() {
        UUID companyId = UUID.randomUUID();
        UUID defId = UUID.randomUUID();

        WorkflowDefinition def = WorkflowDefinition.builder()
                .id(defId)
                .companyId(companyId)
                .workflowCode("FY_WF")
                .workflowName("Fiscal Year Workflow")
                .documentType("FISCAL_YEAR")
                .version(1)
                .isActive(true)
                .build();

        when(definitionRepository.findActiveByDocumentType(companyId, "FISCAL_YEAR"))
                .thenReturn(List.of(def));
        when(stageRepository.findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(defId))
                .thenReturn(Collections.emptyList());
        when(transitionRepository.findByWorkflowDefinitionIdAndIsDeletedFalse(defId))
                .thenReturn(Collections.emptyList());

        WorkflowDefinitionResponse response = definitionService.getActiveDefinitionByDocumentType(companyId, "FISCAL_YEAR");

        assertNotNull(response);
        assertEquals("FY_WF", response.getWorkflowCode());
        assertEquals("FISCAL_YEAR", response.getDocumentType());
    }

    @Test
    void testActivateDefinition_Success() {
        UUID companyId = UUID.randomUUID();
        UUID defId = UUID.randomUUID();

        WorkflowDefinition def = WorkflowDefinition.builder()
                .id(defId)
                .companyId(companyId)
                .workflowCode("FY_WF")
                .isActive(false)
                .build();

        when(definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(defId, companyId))
                .thenReturn(Optional.of(def));

        definitionService.activateDefinition(defId, companyId);

        assertTrue(def.getIsActive());
        verify(definitionRepository).save(def);
    }

    @Test
    void testDeactivateDefinition_Success() {
        UUID companyId = UUID.randomUUID();
        UUID defId = UUID.randomUUID();

        WorkflowDefinition def = WorkflowDefinition.builder()
                .id(defId)
                .companyId(companyId)
                .workflowCode("FY_WF")
                .isActive(true)
                .build();

        when(definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(defId, companyId))
                .thenReturn(Optional.of(def));

        definitionService.deactivateDefinition(defId, companyId);

        assertFalse(def.getIsActive());
        verify(definitionRepository).save(def);
    }

    @Test
    void testDeleteDefinition_Success() {
        UUID companyId = UUID.randomUUID();
        UUID defId = UUID.randomUUID();

        WorkflowDefinition def = WorkflowDefinition.builder()
                .id(defId)
                .companyId(companyId)
                .workflowCode("FY_WF")
                .isActive(true)
                .build();

        WorkflowStage stage = WorkflowStage.builder()
                .id(UUID.randomUUID())
                .stageCode("STAGE_1")
                .sequenceNo(1)
                .build();

        WorkflowTransition transition = WorkflowTransition.builder()
                .id(UUID.randomUUID())
                .actionType(WorkflowActionType.APPROVE)
                .build();

        when(definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(defId, companyId))
                .thenReturn(Optional.of(def));
        when(stageRepository.findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(defId))
                .thenReturn(List.of(stage));
        when(transitionRepository.findByWorkflowDefinitionIdAndIsDeletedFalse(defId))
                .thenReturn(List.of(transition));

        definitionService.deleteDefinition(defId, companyId);

        assertTrue(def.getIsDeleted());
        assertTrue(stage.getIsDeleted());
        assertTrue(transition.getIsDeleted());
        verify(definitionRepository).save(def);
        verify(stageRepository).save(stage);
        verify(transitionRepository).save(transition);
    }

    @Test
    void testUpdateDefinition_PreservesVersionAndPersistsConfigurationFields() {
        UUID companyId = UUID.randomUUID();
        UUID defId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();

        WorkflowDefinition existingDef = WorkflowDefinition.builder()
                .id(defId)
                .companyId(companyId)
                .workflowCode("SALES_APPROVAL")
                .workflowName("Old Name")
                .moduleName("SALES")
                .documentType("QUOTATION")
                .version(1)
                .isActive(true)
                .customerScope("all")
                .build();

        CreateWorkflowDefinitionRequest updateReq = CreateWorkflowDefinitionRequest.builder()
                .companyId(companyId)
                .workflowCode("SALES_APPROVAL")
                .workflowName("Updated Name")
                .moduleName("SALES")
                .documentType("QUOTATION")
                .initiatedByRoleId(roleId)
                .initiatedByRoleName("Accountant")
                .customerScope("specific")
                .approvalThreshold(new java.math.BigDecimal("50000.00"))
                .isApprovalRequired(true)
                .customerAcceptance(true)
                .autoCreateOrder(true)
                .emailNotifications(false)
                .internalNotes("Persisted note")
                .stages(List.of(
                        CreateWorkflowDefinitionRequest.StageRequest.builder()
                                .stageCode("APPROVAL_1")
                                .stageName("Manager Approval")
                                .sequenceNo(1)
                                .executionType(WorkflowExecutionType.SEQUENTIAL)
                                .rejectionAction(WorkflowRejectionAction.REJECT_DOCUMENT)
                                .build()
                ))
                .build();

        when(definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(defId, companyId))
                .thenReturn(Optional.of(existingDef));
        when(definitionRepository.save(any(WorkflowDefinition.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(stageRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(stageRepository.findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(defId))
                .thenReturn(Collections.emptyList());
        when(transitionRepository.findByWorkflowDefinitionIdAndIsDeletedFalse(defId))
                .thenReturn(Collections.emptyList());

        WorkflowDefinitionResponse response = definitionService.updateDefinition(defId, updateReq);

        assertNotNull(response);
        assertEquals(defId, response.getId());
        assertEquals("Updated Name", response.getWorkflowName());
        assertEquals(1, response.getVersion(), "Version should not be incremented on in-place update");
        assertEquals("specific", response.getCustomerScope());
        assertEquals(new java.math.BigDecimal("50000.00"), response.getApprovalThreshold());
        assertTrue(response.getCustomerAcceptance());
        assertTrue(response.getAutoCreateOrder());
        assertFalse(response.getEmailNotifications());
        assertEquals("Persisted note", response.getInternalNotes());
        assertEquals(roleId, response.getInitiatedByRoleId());
        assertEquals("Accountant", response.getInitiatedByRoleName());
    }

    @Test
    void testCanonicalFallback_SalesAndQuotation() {
        UUID companyId = UUID.randomUUID();
        UUID defId = UUID.randomUUID();

        WorkflowDefinition salesDef = WorkflowDefinition.builder()
                .id(defId)
                .companyId(companyId)
                .workflowCode("SALES_APPROVAL")
                .workflowName("Sales Approval")
                .moduleName("SALES")
                .documentType("SALES")
                .version(1)
                .isActive(true)
                .build();

        when(definitionRepository.findActiveByModuleAndDocumentType(companyId, "SALES", "QUOTATION"))
                .thenReturn(Collections.emptyList());
        when(definitionRepository.findActiveByModuleAndDocumentType(companyId, "SALES", "SALES"))
                .thenReturn(List.of(salesDef));
        when(stageRepository.findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(defId))
                .thenReturn(Collections.emptyList());
        when(transitionRepository.findByWorkflowDefinitionIdAndIsDeletedFalse(defId))
                .thenReturn(Collections.emptyList());

        WorkflowDefinitionResponse response = definitionService.getActiveDefinitionByModuleAndDocumentType(
                companyId, "SALES", "QUOTATION");

        assertNotNull(response);
        assertEquals("SALES_APPROVAL", response.getWorkflowCode());
        assertEquals("SALES", response.getDocumentType());
    }
}
