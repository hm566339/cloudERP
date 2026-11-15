package com.erp.crm.modules.automation.repository;

import com.erp.crm.modules.automation.entity.CrmAutomationAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmAutomationActionRepository extends JpaRepository<CrmAutomationAction, UUID> {
    List<CrmAutomationAction> findByCompanyIdAndRuleIdAndIsDeletedFalseOrderByActionOrderAsc(UUID companyId, UUID ruleId);
}

