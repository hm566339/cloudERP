package com.erp.workflow.repository;

import com.erp.workflow.entity.OrgWorkflowTemplateApprover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrgWorkflowTemplateApproverRepository extends JpaRepository<OrgWorkflowTemplateApprover, UUID> {

    List<OrgWorkflowTemplateApprover> findByStage_IdAndIsDeletedFalseOrderByApprovalOrderAsc(UUID stageId);

    void deleteByStage_Id(UUID stageId);
}

