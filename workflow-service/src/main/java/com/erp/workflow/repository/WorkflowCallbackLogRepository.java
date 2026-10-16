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

    @org.springframework.data.jpa.repository.Query("SELECT c FROM WorkflowCallbackLog c WHERE c.succeeded = false AND c.attemptCount >= :minAttempts ORDER BY c.lastAttemptedAt DESC")
    List<WorkflowCallbackLog> findExhaustedCallbacks(@org.springframework.data.repository.query.Param("minAttempts") Integer minAttempts);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM WorkflowCallbackLog c WHERE c.succeeded = false AND c.attemptCount >= :minAttempts AND c.workflowTransaction.companyId = :companyId ORDER BY c.lastAttemptedAt DESC")
    List<WorkflowCallbackLog> findExhaustedCallbacksByCompanyId(@org.springframework.data.repository.query.Param("minAttempts") Integer minAttempts, @org.springframework.data.repository.query.Param("companyId") UUID companyId);
}
