package com.erp.workflow.service;

import com.erp.workflow.dto.request.CreateWorkflowDefinitionRequest;
import com.erp.workflow.dto.response.WorkflowDefinitionResponse;
import com.erp.workflow.entity.WorkflowDefinition;
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
}
