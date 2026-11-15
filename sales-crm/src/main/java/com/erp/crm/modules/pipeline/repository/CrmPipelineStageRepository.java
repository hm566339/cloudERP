package com.erp.crm.modules.pipeline.repository;

import com.erp.crm.modules.pipeline.entity.CrmPipelineStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmPipelineStageRepository extends JpaRepository<CrmPipelineStage, UUID> {
    List<CrmPipelineStage> findByPipelineIdAndIsDeletedFalseOrderByStageOrderAsc(UUID pipelineId);
    Optional<CrmPipelineStage> findByPipelineIdAndStageCodeAndIsDeletedFalse(UUID pipelineId, String stageCode);
    Optional<CrmPipelineStage> findByPipelineIdAndIdAndIsDeletedFalse(UUID pipelineId, UUID id);
}

