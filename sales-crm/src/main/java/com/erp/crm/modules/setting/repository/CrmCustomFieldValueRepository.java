package com.erp.crm.modules.setting.repository;

import com.erp.crm.modules.setting.entity.CrmCustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmCustomFieldValueRepository extends JpaRepository<CrmCustomFieldValue, UUID> {
    List<CrmCustomFieldValue> findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalse(UUID companyId, String entityType, UUID entityId);
    Optional<CrmCustomFieldValue> findByCustomFieldIdAndEntityIdAndIsDeletedFalse(UUID customFieldId, UUID entityId);
}

