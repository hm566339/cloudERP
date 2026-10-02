package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowApprover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowApproverRepository extends JpaRepository<WorkflowApprover, UUID> {

    List<WorkflowApprover> findByWorkflowStageIdAndIsDeletedFalseOrderByApprovalOrderAsc(UUID workflowStageId);

    List<WorkflowApprover> findByWorkflowStageIdInAndIsDeletedFalse(List<UUID> stageIds);
}
