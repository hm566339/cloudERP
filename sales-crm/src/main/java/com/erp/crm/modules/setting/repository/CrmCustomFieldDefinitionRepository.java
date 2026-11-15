package com.erp.crm.modules.setting.repository;

import com.erp.crm.modules.setting.entity.CrmCustomFieldDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmCustomFieldDefinitionRepository extends JpaRepository<CrmCustomFieldDefinition, UUID> {
    List<CrmCustomFieldDefinition> findByCompanyIdAndEntityNameAndIsDeletedFalseOrderByDisplayOrderAsc(UUID companyId, String entityName);
    Optional<CrmCustomFieldDefinition> findByCompanyIdAndEntityNameAndFieldKeyAndIsDeletedFalse(UUID companyId, String entityName, String fieldKey);
}

