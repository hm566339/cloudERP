package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowAttachmentRepository extends JpaRepository<WorkflowAttachment, UUID> {

    List<WorkflowAttachment> findByWorkflowTransactionIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID workflowTransactionId);

    List<WorkflowAttachment> findByWorkflowTaskIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID workflowTaskId);
}
