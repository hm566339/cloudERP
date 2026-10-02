package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowCommentRepository extends JpaRepository<WorkflowComment, UUID> {

    List<WorkflowComment> findByWorkflowTransactionIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID workflowTransactionId);

    List<WorkflowComment> findByWorkflowTaskIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID workflowTaskId);
}
