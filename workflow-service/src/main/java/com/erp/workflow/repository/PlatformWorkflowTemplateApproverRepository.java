package com.erp.workflow.repository;

import com.erp.workflow.entity.PlatformWorkflowTemplateApprover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlatformWorkflowTemplateApproverRepository extends JpaRepository<PlatformWorkflowTemplateApprover, UUID> {

    List<PlatformWorkflowTemplateApprover> findByStage_IdAndIsDeletedFalseOrderByApprovalOrderAsc(UUID stageId);

    void deleteByStage_Id(UUID stageId);
}

