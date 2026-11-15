package com.erp.crm.modules.pipeline.repository;

import com.erp.crm.modules.pipeline.entity.CrmOpportunity;
import com.erp.crm.modules.pipeline.enums.OpportunityDealStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmOpportunityRepository extends JpaRepository<CrmOpportunity, UUID>, JpaSpecificationExecutor<CrmOpportunity> {

    Optional<CrmOpportunity> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);

    Optional<CrmOpportunity> findByCompanyIdAndOpportunityCodeAndIsDeletedFalse(UUID companyId, String opportunityCode);

    List<CrmOpportunity> findByCompanyIdAndPipelineIdAndIsDeletedFalse(UUID companyId, UUID pipelineId);

    List<CrmOpportunity> findByCompanyIdAndPipelineIdAndCurrentStageIdAndIsDeletedFalse(UUID companyId, UUID pipelineId, UUID stageId);

    Page<CrmOpportunity> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    @Query("SELECT COUNT(o) FROM CrmOpportunity o WHERE o.companyId = :companyId AND o.dealStatus = :status AND o.isDeleted = false")
    long countByCompanyIdAndDealStatus(@Param("companyId") UUID companyId, @Param("status") OpportunityDealStatus status);

    @Query("SELECT COALESCE(SUM(o.dealValue), 0) FROM CrmOpportunity o WHERE o.companyId = :companyId AND o.dealStatus = :status AND o.isDeleted = false")
    BigDecimal sumDealValueByStatus(@Param("companyId") UUID companyId, @Param("status") OpportunityDealStatus status);
}

