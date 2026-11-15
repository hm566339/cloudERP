package com.erp.crm.modules.setting.repository;

import com.erp.crm.modules.setting.entity.CrmLeadSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmLeadSourceRepository extends JpaRepository<CrmLeadSource, UUID> {
    Optional<CrmLeadSource> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
    List<CrmLeadSource> findByCompanyIdAndIsDeletedFalseAndIsActiveTrue(UUID companyId);
    Optional<CrmLeadSource> findByCompanyIdAndSourceCodeAndIsDeletedFalse(UUID companyId, String sourceCode);
}

