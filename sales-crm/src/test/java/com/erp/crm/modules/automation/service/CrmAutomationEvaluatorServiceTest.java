package com.erp.crm.modules.automation.service;

import com.erp.crm.modules.activity.repository.CrmTaskRepository;
import com.erp.crm.modules.automation.entity.CrmAutomationAction;
import com.erp.crm.modules.automation.entity.CrmAutomationExecutionLog;
import com.erp.crm.modules.automation.entity.CrmAutomationRule;
import com.erp.crm.modules.automation.enums.AutomationActionType;
import com.erp.crm.modules.automation.enums.AutomationTrigger;
import com.erp.crm.modules.automation.repository.CrmAutomationActionRepository;
import com.erp.crm.modules.automation.repository.CrmAutomationExecutionLogRepository;
import com.erp.crm.modules.automation.repository.CrmAutomationRuleRepository;
import com.erp.crm.modules.lead.entity.CrmLead;
import com.erp.crm.modules.lead.repository.CrmLeadRepository;
import com.erp.crm.modules.outbox.service.CrmOutboxService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmAutomationEvaluatorServiceTest {

    @Mock
    private CrmAutomationRuleRepository ruleRepository;
    @Mock
    private CrmAutomationActionRepository actionRepository;
    @Mock
    private CrmAutomationExecutionLogRepository logRepository;
    @Mock
    private RoundRobinAssignmentService roundRobinAssignmentService;
    @Mock
    private CrmLeadRepository leadRepository;
    @Mock
    private CrmTaskRepository taskRepository;
    @Mock
    private CrmOutboxService outboxService;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private CrmAutomationEvaluatorService evaluatorService;

    @Test
    @DisplayName("Safe SpEL evaluation should evaluate read-only bean properties correctly")
    void testSafeSpelEvaluation() {
        CrmLead lead = CrmLead.builder()
                .state("Maharashtra")
                .leadScore(85)
                .build();

        assertTrue(evaluatorService.evaluateCondition("state == 'Maharashtra' and leadScore >= 80", lead));
        assertFalse(evaluatorService.evaluateCondition("state == 'Gujarat'", lead));
    }

    @Test
    @DisplayName("Malicious SpEL expression trying arbitrary method execution should fail closed safely")
    void testSpelInjectionProtection() {
        CrmLead lead = CrmLead.builder().state("Maharashtra").build();

        // SimpleEvaluationContext prevents T(type) and system method invocation
        String maliciousPayload = "T(java.lang.System).exit(0)";
        boolean result = evaluatorService.evaluateCondition(maliciousPayload, lead);
        assertFalse(result, "Malicious SpEL invocation must fail closed and return false");
    }

    @Test
    @DisplayName("Should evaluate rule and trigger automated task creation")
    void testEvaluateAndExecuteCreateTask() {
        UUID companyId = UUID.randomUUID();
        UUID leadId = UUID.randomUUID();
        UUID ruleId = UUID.randomUUID();

        CrmLead lead = CrmLead.builder()
                .id(leadId)
                .leadScore(90)
                .state("Maharashtra")
                .build();
        lead.setCompanyId(companyId);

        CrmAutomationRule rule = CrmAutomationRule.builder()
                .id(ruleId)
                .ruleCode("HIGH_SCORE_TASK")
                .triggerEvent(AutomationTrigger.LEAD_CREATED)
                .filterConditionsJson("leadScore >= 80")
                .isActive(true)
                .build();
        rule.setCompanyId(companyId);

        CrmAutomationAction action = CrmAutomationAction.builder()
                .id(UUID.randomUUID())
                .ruleId(ruleId)
                .actionType(AutomationActionType.CREATE_TASK)
                .actionPayloadJson("{\"title\": \"Follow up VIP Lead\", \"taskType\": \"FOLLOW_UP\"}")
                .build();
        action.setCompanyId(companyId);

        when(ruleRepository.findByCompanyIdAndTriggerEventAndIsActiveTrueAndIsDeletedFalseOrderByExecutionOrderAsc(
                companyId, AutomationTrigger.LEAD_CREATED)).thenReturn(List.of(rule));
        when(actionRepository.findByCompanyIdAndRuleIdAndIsDeletedFalseOrderByActionOrderAsc(companyId, ruleId))
                .thenReturn(List.of(action));

        evaluatorService.evaluateAndExecute(companyId, AutomationTrigger.LEAD_CREATED, lead, leadId, "LEAD");

        verify(taskRepository).save(any());
        verify(logRepository).save(any(CrmAutomationExecutionLog.class));
    }
}

