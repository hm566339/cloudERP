package com.erp.crm.modules.automation.service;

import com.erp.crm.modules.activity.entity.CrmTask;
import com.erp.crm.modules.activity.enums.TaskPriority;
import com.erp.crm.modules.activity.enums.TaskStatus;
import com.erp.crm.modules.activity.enums.TaskType;
import com.erp.crm.modules.activity.repository.CrmTaskRepository;
import com.erp.crm.modules.automation.entity.CrmAutomationAction;
import com.erp.crm.modules.automation.entity.CrmAutomationExecutionLog;
import com.erp.crm.modules.automation.entity.CrmAutomationRule;
import com.erp.crm.modules.automation.enums.AutomationTrigger;
import com.erp.crm.modules.automation.repository.CrmAutomationActionRepository;
import com.erp.crm.modules.automation.repository.CrmAutomationExecutionLogRepository;
import com.erp.crm.modules.automation.repository.CrmAutomationRuleRepository;
import com.erp.crm.modules.lead.entity.CrmLead;
import com.erp.crm.modules.lead.repository.CrmLeadRepository;
import com.erp.crm.modules.outbox.service.CrmOutboxService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.SimpleEvaluationContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrmAutomationEvaluatorService {

    private final CrmAutomationRuleRepository ruleRepository;
    private final CrmAutomationActionRepository actionRepository;
    private final CrmAutomationExecutionLogRepository logRepository;
    private final RoundRobinAssignmentService roundRobinAssignmentService;
    private final CrmLeadRepository leadRepository;
    private final CrmTaskRepository taskRepository;
    private final CrmOutboxService outboxService;
    private final ObjectMapper objectMapper;

    private final ExpressionParser expressionParser = new SpelExpressionParser();

    /**
     * Evaluates active rules for the given trigger event and entity.
     */
    @Transactional
    public void evaluateAndExecute(UUID companyId, AutomationTrigger triggerEvent, Object entity, UUID entityId, String entityType) {
        if (companyId == null || triggerEvent == null || entity == null) {
            return;
        }

        List<CrmAutomationRule> rules = ruleRepository
                .findByCompanyIdAndTriggerEventAndIsActiveTrueAndIsDeletedFalseOrderByExecutionOrderAsc(companyId, triggerEvent);

        if (rules.isEmpty()) {
            return;
        }

        log.debug("Evaluating {} automation rules for trigger {} on {} [{}]",
                rules.size(), triggerEvent, entityType, entityId);

        for (CrmAutomationRule rule : rules) {
            long startTime = System.currentTimeMillis();
            boolean matched = evaluateCondition(rule.getFilterConditionsJson(), entity);
            if (!matched) {
                continue;
            }

            log.info("Rule [{}] matched for {} [{}]", rule.getRuleCode(), entityType, entityId);
            List<CrmAutomationAction> actions = actionRepository
                    .findByCompanyIdAndRuleIdAndIsDeletedFalseOrderByActionOrderAsc(companyId, rule.getId());

            for (CrmAutomationAction action : actions) {
                executeAction(companyId, rule, action, entity, entityId, entityType, startTime);
            }
        }
    }

    /**
     * Evaluates condition string using safe, restricted SpEL (data binding only, no method execution or reflection).
     */
    public boolean evaluateCondition(String condition, Object entity) {
        if (condition == null || condition.isBlank() || "{}".equals(condition.trim()) || "true".equalsIgnoreCase(condition.trim())) {
            return true;
        }

        try {
            // Check if JSON condition
            if (condition.trim().startsWith("{")) {
                JsonNode node = objectMapper.readTree(condition);
                // Simple JSON field matching if SpEL expression is inside "spel" or field matching
                if (node.has("spel")) {
                    String spel = node.get("spel").asText();
                    return evaluateSpel(spel, entity);
                }
                return true;
            }

            return evaluateSpel(condition, entity);
        } catch (Exception e) {
            log.warn("Failed to evaluate automation rule condition [{}]: {}", condition, e.getMessage());
            return false;
        }
    }

    private boolean evaluateSpel(String spel, Object entity) {
        try {
            // Strict read-only context: Disallows arbitrary method invocation, constructors, types
            SimpleEvaluationContext context = SimpleEvaluationContext.forReadOnlyDataBinding().build();
            Expression exp = expressionParser.parseExpression(spel);
            Boolean result = exp.getValue(context, entity, Boolean.class);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.warn("SpEL evaluation error for expression '{}': {}", spel, e.getMessage());
            return false;
        }
    }

    private void executeAction(UUID companyId, CrmAutomationRule rule, CrmAutomationAction action,
                               Object entity, UUID entityId, String entityType, long startTime) {
        String status = "SUCCESS";
        String errorMsg = null;

        try {
            switch (action.getActionType()) {
                case AUTO_ASSIGN_ROUND_ROBIN -> executeAutoAssign(companyId, action, entity, entityId);
                case CREATE_TASK -> executeCreateTask(companyId, action, entityId, entityType);
                case UPDATE_FIELD -> executeUpdateField(companyId, action, entity);
                case SEND_NOTIFICATION, DISPATCH_WHATSAPP, DISPATCH_EMAIL -> executeNotification(companyId, action, entityId, entityType);
                default -> log.debug("Action type {} queued", action.getActionType());
            }
        } catch (Exception e) {
            status = "FAILED";
            errorMsg = e.getMessage();
            log.error("Failed to execute action [{}] for rule [{}]: {}",
                    action.getActionType(), rule.getRuleCode(), e.getMessage());
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            CrmAutomationExecutionLog executionLog = CrmAutomationExecutionLog.builder()
                    .companyId(companyId)
                    .ruleId(rule.getId())
                    .actionId(action.getId())
                    .entityType(entityType)
                    .entityId(entityId)
                    .status(status)
                    .durationMs(duration)
                    .errorMessage(errorMsg)
                    .executionContextJson(action.getActionPayloadJson())
                    .build();
            logRepository.save(executionLog);
        }
    }

    private void executeAutoAssign(UUID companyId, CrmAutomationAction action, Object entity, UUID entityId) throws Exception {
        JsonNode payload = objectMapper.readTree(action.getActionPayloadJson());
        UUID poolId = null;
        if (payload.has("poolId")) {
            poolId = UUID.fromString(payload.get("poolId").asText());
        }

        if (poolId != null) {
            Optional<UUID> assignee = roundRobinAssignmentService.getNextAssignee(companyId, poolId);
            if (assignee.isPresent() && entity instanceof CrmLead lead) {
                lead.setOwnerUserId(assignee.get());
                leadRepository.save(lead);
                log.info("Lead [{}] automatically reassigned to [{}] via Round Robin", entityId, assignee.get());
            }
        }
    }

    private void executeCreateTask(UUID companyId, CrmAutomationAction action, UUID entityId, String entityType) throws Exception {
        JsonNode payload = objectMapper.readTree(action.getActionPayloadJson());
        String title = payload.has("title") ? payload.get("title").asText() : "Automated Follow-up";
        String taskTypeStr = payload.has("taskType") ? payload.get("taskType").asText() : "FOLLOW_UP";
        TaskType taskType = TaskType.valueOf(taskTypeStr);

        CrmTask task = CrmTask.builder()
                .entityType(entityType)
                .entityId(entityId)
                .taskType(taskType)
                .title(title)
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.PENDING)
                .dueDate(LocalDate.now().plusDays(1))
                .build();
        task.setCompanyId(companyId);
        taskRepository.save(task);
        log.info("Created automated task [{}] for {} [{}]", title, entityType, entityId);
    }

    private void executeUpdateField(UUID companyId, CrmAutomationAction action, Object entity) throws Exception {
        JsonNode payload = objectMapper.readTree(action.getActionPayloadJson());
        if (entity instanceof CrmLead lead) {
            if (payload.has("rating")) {
                lead.setScoreGrade(com.erp.crm.modules.lead.enums.LeadRating.valueOf(payload.get("rating").asText()));
            }
            leadRepository.save(lead);
        }
    }

    private void executeNotification(UUID companyId, CrmAutomationAction action, UUID entityId, String entityType) {
        outboxService.publishEvent(companyId, entityType, entityId, "AUTOMATION_NOTIFICATION", action.getActionPayloadJson());
    }
}
