package com.erp.crm.modules.pipeline.repository;

import com.erp.crm.modules.pipeline.entity.CrmSalesPipeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmSalesPipelineRepository extends JpaRepository<CrmSalesPipeline, UUID> {
    List<CrmSalesPipeline> findByCompanyIdAndIsDeletedFalseOrderByDisplayOrderAsc(UUID companyId);
    Optional<CrmSalesPipeline> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
    Optional<CrmSalesPipeline> findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(UUID companyId);
}

