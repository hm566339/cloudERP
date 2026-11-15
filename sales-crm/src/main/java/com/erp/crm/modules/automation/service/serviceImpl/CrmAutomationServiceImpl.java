package com.erp.crm.modules.automation.service.serviceImpl;

import com.erp.crm.common.exception.ConflictException;
import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.security.CurrentUserContext;
import com.erp.crm.modules.automation.dto.*;
import com.erp.crm.modules.automation.entity.*;
import com.erp.crm.modules.automation.repository.*;
import com.erp.crm.modules.automation.service.CrmAutomationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrmAutomationServiceImpl implements CrmAutomationService {

    private final CrmAutomationRuleRepository ruleRepository;
    private final CrmAutomationActionRepository actionRepository;
    private final CrmAutomationExecutionLogRepository logRepository;
    private final CrmRoundRobinPoolRepository poolRepository;
    private final CrmRoundRobinMemberRepository memberRepository;

    @Override
    @Transactional
    public AutomationRuleResponse createRule(AutomationRuleRequest request, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);

        CrmAutomationRule rule = CrmAutomationRule.builder()
                .ruleName(request.getRuleName())
                .ruleCode(request.getRuleCode().trim().toUpperCase())
                .description(request.getDescription())
                .triggerEvent(request.getTriggerEvent())
                .entityType(request.getEntityType().trim().toUpperCase())
                .filterConditionsJson(request.getFilterConditionsJson())
                .executionOrder(request.getExecutionOrder() != null ? request.getExecutionOrder() : 10)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        rule.setCompanyId(effectiveCompanyId);

        CrmAutomationRule savedRule = ruleRepository.save(rule);

        List<CrmAutomationAction> savedActions = new ArrayList<>();
        if (request.getActions() != null && !request.getActions().isEmpty()) {
            int order = 1;
            for (AutomationActionDto actionDto : request.getActions()) {
                CrmAutomationAction action = CrmAutomationAction.builder()
                        .ruleId(savedRule.getId())
                        .actionOrder(actionDto.getActionOrder() != null ? actionDto.getActionOrder() : order++)
                        .actionType(actionDto.getActionType())
                        .actionPayloadJson(actionDto.getActionPayloadJson())
                        .delayMinutes(actionDto.getDelayMinutes() != null ? actionDto.getDelayMinutes() : 0)
                        .build();
                action.setCompanyId(effectiveCompanyId);
                savedActions.add(actionRepository.save(action));
            }
        }

        return mapToRuleResponse(savedRule, savedActions);
    }

    @Override
    @Transactional(readOnly = true)
    public AutomationRuleResponse getRuleById(UUID id, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        CrmAutomationRule rule = ruleRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Automation rule not found: " + id));

        List<CrmAutomationAction> actions = actionRepository
                .findByCompanyIdAndRuleIdAndIsDeletedFalseOrderByActionOrderAsc(effectiveCompanyId, rule.getId());

        return mapToRuleResponse(rule, actions);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AutomationRuleResponse> getAllRules(UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        List<CrmAutomationRule> rules = ruleRepository.findByCompanyIdAndIsDeletedFalse(effectiveCompanyId);
        List<AutomationRuleResponse> responses = new ArrayList<>();
        for (CrmAutomationRule rule : rules) {
            List<CrmAutomationAction> actions = actionRepository
                    .findByCompanyIdAndRuleIdAndIsDeletedFalseOrderByActionOrderAsc(effectiveCompanyId, rule.getId());
            responses.add(mapToRuleResponse(rule, actions));
        }
        return responses;
    }

    @Override
    @Transactional
    public AutomationRuleResponse updateRule(UUID id, AutomationRuleRequest request, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        CrmAutomationRule rule = ruleRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Automation rule not found: " + id));

        rule.setRuleName(request.getRuleName());
        rule.setDescription(request.getDescription());
        rule.setTriggerEvent(request.getTriggerEvent());
        rule.setEntityType(request.getEntityType().trim().toUpperCase());
        rule.setFilterConditionsJson(request.getFilterConditionsJson());
        if (request.getExecutionOrder() != null) {
            rule.setExecutionOrder(request.getExecutionOrder());
        }
        if (request.getIsActive() != null) {
            rule.setIsActive(request.getIsActive());
        }

        CrmAutomationRule updated = ruleRepository.save(rule);

        List<CrmAutomationAction> actions = actionRepository
                .findByCompanyIdAndRuleIdAndIsDeletedFalseOrderByActionOrderAsc(effectiveCompanyId, rule.getId());

        return mapToRuleResponse(updated, actions);
    }

    @Override
    @Transactional
    public void deleteRule(UUID id, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        CrmAutomationRule rule = ruleRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Automation rule not found: " + id));
        rule.setIsDeleted(true);
        ruleRepository.save(rule);
    }

    @Override
    @Transactional
    public RoundRobinPoolResponse createPool(RoundRobinPoolRequest request, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);

        poolRepository.findByCompanyIdAndPoolCodeAndIsDeletedFalse(effectiveCompanyId, request.getPoolCode())
                .ifPresent(p -> {
                    throw new ConflictException("Round robin pool code already exists: " + request.getPoolCode());
                });

        CrmRoundRobinPool pool = CrmRoundRobinPool.builder()
                .poolName(request.getPoolName())
                .poolCode(request.getPoolCode().trim().toUpperCase())
                .routingStrategy(request.getRoutingStrategy())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        pool.setCompanyId(effectiveCompanyId);

        CrmRoundRobinPool savedPool = poolRepository.save(pool);

        List<CrmRoundRobinMember> savedMembers = new ArrayList<>();
        if (request.getMembers() != null) {
            for (RoundRobinPoolRequest.RoundRobinMemberDto memberDto : request.getMembers()) {
                CrmRoundRobinMember member = CrmRoundRobinMember.builder()
                        .poolId(savedPool.getId())
                        .userId(memberDto.getUserId())
                        .weight(memberDto.getWeight() != null ? memberDto.getWeight() : 1)
                        .maxDailyLeads(memberDto.getMaxDailyLeads() != null ? memberDto.getMaxDailyLeads() : 50)
                        .currentLeadsToday(0)
                        .isActive(memberDto.getIsActive() != null ? memberDto.getIsActive() : true)
                        .build();
                member.setCompanyId(effectiveCompanyId);
                savedMembers.add(memberRepository.save(member));
            }
        }

        return mapToPoolResponse(savedPool, savedMembers);
    }

    @Override
    @Transactional(readOnly = true)
    public RoundRobinPoolResponse getPoolById(UUID id, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        CrmRoundRobinPool pool = poolRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Round robin pool not found: " + id));

        List<CrmRoundRobinMember> members = memberRepository
                .findByCompanyIdAndPoolIdAndIsActiveTrueAndIsDeletedFalse(effectiveCompanyId, pool.getId());

        return mapToPoolResponse(pool, members);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoundRobinPoolResponse> getAllPools(UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        List<CrmRoundRobinPool> pools = poolRepository.findByCompanyIdAndIsDeletedFalse(effectiveCompanyId);
        List<RoundRobinPoolResponse> responses = new ArrayList<>();
        for (CrmRoundRobinPool pool : pools) {
            List<CrmRoundRobinMember> members = memberRepository
                    .findByCompanyIdAndPoolIdAndIsActiveTrueAndIsDeletedFalse(effectiveCompanyId, pool.getId());
            responses.add(mapToPoolResponse(pool, members));
        }
        return responses;
    }

    @Override
    @Transactional
    public RoundRobinPoolResponse updatePool(UUID id, RoundRobinPoolRequest request, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        CrmRoundRobinPool pool = poolRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Round robin pool not found: " + id));

        pool.setPoolName(request.getPoolName());
        pool.setRoutingStrategy(request.getRoutingStrategy());
        if (request.getIsActive() != null) {
            pool.setIsActive(request.getIsActive());
        }

        CrmRoundRobinPool updated = poolRepository.save(pool);
        List<CrmRoundRobinMember> members = memberRepository
                .findByCompanyIdAndPoolIdAndIsActiveTrueAndIsDeletedFalse(effectiveCompanyId, pool.getId());

        return mapToPoolResponse(updated, members);
    }

    @Override
    @Transactional
    public void deletePool(UUID id, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        CrmRoundRobinPool pool = poolRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Round robin pool not found: " + id));
        pool.setIsDeleted(true);
        poolRepository.save(pool);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CrmAutomationExecutionLog> getExecutionLogs(UUID companyId, Pageable pageable) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        return logRepository.findByCompanyIdOrderByExecutedAtDesc(effectiveCompanyId, pageable);
    }

    private UUID resolveCompanyId(UUID explicitCompanyId) {
        return CurrentUserContext.resolveCompanyId(explicitCompanyId);
    }

    private AutomationRuleResponse mapToRuleResponse(CrmAutomationRule rule, List<CrmAutomationAction> actions) {
        List<AutomationActionResponse> actionResponses = actions.stream()
                .map(a -> AutomationActionResponse.builder()
                        .id(a.getId())
                        .ruleId(a.getRuleId())
                        .actionOrder(a.getActionOrder())
                        .actionType(a.getActionType())
                        .actionPayloadJson(a.getActionPayloadJson())
                        .delayMinutes(a.getDelayMinutes())
                        .build())
                .toList();

        return AutomationRuleResponse.builder()
                .id(rule.getId())
                .companyId(rule.getCompanyId())
                .ruleName(rule.getRuleName())
                .ruleCode(rule.getRuleCode())
                .description(rule.getDescription())
                .triggerEvent(rule.getTriggerEvent())
                .entityType(rule.getEntityType())
                .filterConditionsJson(rule.getFilterConditionsJson())
                .executionOrder(rule.getExecutionOrder())
                .isActive(rule.getIsActive())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .actions(actionResponses)
                .build();
    }

    private RoundRobinPoolResponse mapToPoolResponse(CrmRoundRobinPool pool, List<CrmRoundRobinMember> members) {
        List<RoundRobinPoolResponse.RoundRobinMemberResponse> memberResponses = members.stream()
                .map(m -> RoundRobinPoolResponse.RoundRobinMemberResponse.builder()
                        .id(m.getId())
                        .poolId(m.getPoolId())
                        .userId(m.getUserId())
                        .weight(m.getWeight())
                        .maxDailyLeads(m.getMaxDailyLeads())
                        .currentLeadsToday(m.getCurrentLeadsToday())
                        .lastAssignedAt(m.getLastAssignedAt())
                        .isActive(m.getIsActive())
                        .build())
                .toList();

        return RoundRobinPoolResponse.builder()
                .id(pool.getId())
                .companyId(pool.getCompanyId())
                .poolName(pool.getPoolName())
                .poolCode(pool.getPoolCode())
                .routingStrategy(pool.getRoutingStrategy())
                .isActive(pool.getIsActive())
                .createdAt(pool.getCreatedAt())
                .updatedAt(pool.getUpdatedAt())
                .members(memberResponses)
                .build();
    }
}
