package com.erp.crm.modules.setting.repository;

import com.erp.crm.modules.setting.entity.CrmLeadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmLeadStatusRepository extends JpaRepository<CrmLeadStatus, UUID> {
    Optional<CrmLeadStatus> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
    List<CrmLeadStatus> findByCompanyIdAndIsDeletedFalseOrderByDisplayOrderAsc(UUID companyId);
    Optional<CrmLeadStatus> findByCompanyIdAndStatusCodeAndIsDeletedFalse(UUID companyId, String statusCode);
    Optional<CrmLeadStatus> findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(UUID companyId);
}

