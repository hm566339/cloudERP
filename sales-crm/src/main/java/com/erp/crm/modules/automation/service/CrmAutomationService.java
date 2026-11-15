package com.erp.crm.modules.automation.service;

import com.erp.crm.modules.automation.dto.AutomationRuleRequest;
import com.erp.crm.modules.automation.dto.AutomationRuleResponse;
import com.erp.crm.modules.automation.dto.RoundRobinPoolRequest;
import com.erp.crm.modules.automation.dto.RoundRobinPoolResponse;
import com.erp.crm.modules.automation.entity.CrmAutomationExecutionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CrmAutomationService {

    // Rules
    AutomationRuleResponse createRule(AutomationRuleRequest request, UUID companyId);
    AutomationRuleResponse getRuleById(UUID id, UUID companyId);
    List<AutomationRuleResponse> getAllRules(UUID companyId);
    AutomationRuleResponse updateRule(UUID id, AutomationRuleRequest request, UUID companyId);
    void deleteRule(UUID id, UUID companyId);

    // Pools
    RoundRobinPoolResponse createPool(RoundRobinPoolRequest request, UUID companyId);
    RoundRobinPoolResponse getPoolById(UUID id, UUID companyId);
    List<RoundRobinPoolResponse> getAllPools(UUID companyId);
    RoundRobinPoolResponse updatePool(UUID id, RoundRobinPoolRequest request, UUID companyId);
    void deletePool(UUID id, UUID companyId);

    // Logs
    Page<CrmAutomationExecutionLog> getExecutionLogs(UUID companyId, Pageable pageable);
}

