package com.erp.crm.modules.automation.repository;

import com.erp.crm.modules.automation.entity.CrmAutomationRule;
import com.erp.crm.modules.automation.enums.AutomationTrigger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmAutomationRuleRepository extends JpaRepository<CrmAutomationRule, UUID> {
    List<CrmAutomationRule> findByCompanyIdAndTriggerEventAndIsActiveTrueAndIsDeletedFalseOrderByExecutionOrderAsc(
            UUID companyId, AutomationTrigger triggerEvent);
    List<CrmAutomationRule> findByCompanyIdAndIsDeletedFalse(UUID companyId);
    Optional<CrmAutomationRule> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
}

