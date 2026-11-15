package com.erp.crm.modules.integration.repository;

import com.erp.crm.modules.integration.entity.CrmLeadImportBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmLeadImportBatchRepository extends JpaRepository<CrmLeadImportBatch, UUID> {
    List<CrmLeadImportBatch> findByCompanyIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID companyId);
    Optional<CrmLeadImportBatch> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
}

