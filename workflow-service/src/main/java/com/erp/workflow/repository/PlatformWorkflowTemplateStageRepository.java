package com.erp.workflow.repository;

import com.erp.workflow.entity.PlatformWorkflowTemplateStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlatformWorkflowTemplateStageRepository extends JpaRepository<PlatformWorkflowTemplateStage, UUID> {

    List<PlatformWorkflowTemplateStage> findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(UUID templateId);

    void deleteByTemplate_Id(UUID templateId);
}

