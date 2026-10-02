package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowCallbackLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowCallbackLogRepository extends JpaRepository<WorkflowCallbackLog, UUID> {

    List<WorkflowCallbackLog> findByWorkflowTransactionIdOrderByCreatedAtAsc(UUID workflowTransactionId);

    List<WorkflowCallbackLog> findBySucceededFalseAndAttemptCountLessThanAndLastAttemptedAtBefore(
            Integer maxAttempts, LocalDateTime cutoff);
}
