package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowTask;
import com.erp.workflow.enums.WorkflowTaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowTaskRepository extends JpaRepository<WorkflowTask, UUID> {

    List<WorkflowTask> findByWorkflowTransactionIdAndIsDeletedFalseOrderByAssignedAtAsc(UUID transactionId);

    List<WorkflowTask> findByWorkflowTransactionIdAndWorkflowStageIdAndTaskStatusAndIsDeletedFalse(
            UUID transactionId, UUID stageId, WorkflowTaskStatus status);

    Optional<WorkflowTask> findByIdAndIsDeletedFalse(UUID id);

    @Query("SELECT t FROM WorkflowTask t WHERE (t.assignedUserId = :userId OR t.assignedRoleName IN :roles) " +
           "AND t.taskStatus = :status AND t.isDeleted = false")
    Page<WorkflowTask> findUserTasks(
            @Param("userId") UUID userId,
            @Param("roles") List<String> roles,
            @Param("status") WorkflowTaskStatus status,
            Pageable pageable);

    @Query("SELECT t FROM WorkflowTask t JOIN t.workflowTransaction tx " +
           "WHERE tx.companyId = :companyId " +
           "AND (t.assignedUserId = :userId OR t.assignedRoleName IN :roles) " +
           "AND t.taskStatus = :status AND t.isDeleted = false")
    Page<WorkflowTask> findUserTasksByCompany(
            @Param("companyId") UUID companyId,
            @Param("userId") UUID userId,
            @Param("roles") List<String> roles,
            @Param("status") WorkflowTaskStatus status,
            Pageable pageable);

    @Query("SELECT t FROM WorkflowTask t WHERE t.assignedUserId = :userId " +
           "AND t.taskStatus = :status AND t.isDeleted = false")
    Page<WorkflowTask> findByAssignedUserIdAndTaskStatusAndIsDeletedFalse(
            @Param("userId") UUID userId,
            @Param("status") WorkflowTaskStatus status,
            Pageable pageable);

    @Query("SELECT t FROM WorkflowTask t JOIN t.workflowTransaction tx " +
           "WHERE tx.companyId = :companyId " +
           "AND t.assignedUserId = :userId " +
           "AND t.taskStatus = :status AND t.isDeleted = false")
    Page<WorkflowTask> findByCompanyIdAndAssignedUserIdAndTaskStatusAndIsDeletedFalse(
            @Param("companyId") UUID companyId,
            @Param("userId") UUID userId,
            @Param("status") WorkflowTaskStatus status,
            Pageable pageable);

    @Query("SELECT t FROM WorkflowTask t WHERE t.taskStatus = 'PENDING' " +
           "AND t.dueAt IS NOT NULL AND t.dueAt < :cutoff AND t.isDeleted = false")
    List<WorkflowTask> findOverdueTasks(@Param("cutoff") LocalDateTime cutoff);

    long countByWorkflowTransactionIdAndWorkflowStageIdAndTaskStatusAndIsDeletedFalse(
            UUID transactionId, UUID stageId, WorkflowTaskStatus status);
}
