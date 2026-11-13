package com.erp.workflow.repository;

import com.erp.workflow.entity.OrgWorkflowTemplateStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrgWorkflowTemplateStageRepository extends JpaRepository<OrgWorkflowTemplateStage, UUID> {

    List<OrgWorkflowTemplateStage> findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(UUID templateId);

    void deleteByTemplate_Id(UUID templateId);
}

