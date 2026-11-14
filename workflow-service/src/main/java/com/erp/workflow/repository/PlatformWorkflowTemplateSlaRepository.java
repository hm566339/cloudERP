package com.erp.workflow.repository;

import com.erp.workflow.entity.PlatformWorkflowTemplateSla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlatformWorkflowTemplateSlaRepository extends JpaRepository<PlatformWorkflowTemplateSla, UUID> {

    List<PlatformWorkflowTemplateSla> findByStage_IdAndIsDeletedFalse(UUID stageId);

    void deleteByStage_Id(UUID stageId);
}

