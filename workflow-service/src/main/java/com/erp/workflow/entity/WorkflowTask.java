package com.erp.workflow.entity;

import com.erp.workflow.enums.WorkflowTaskStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * An actionable approval task assigned to a user for a specific workflow stage.
 * Uses optimistic locking to prevent concurrent action conflicts.
 */
@Entity
@Table(name = "workflow_task")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTask {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_transaction_id", nullable = false)
    private WorkflowTransaction workflowTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_stage_id", nullable = false)
    private WorkflowStage workflowStage;

    @Column(name = "assigned_user_id")
    private UUID assignedUserId;

    @Column(name = "assigned_role_name", length = 100)
    private String assignedRoleName;

    /** If this task was created via delegation, original user is stored here */
    @Column(name = "delegated_from_user_id")
    private UUID delegatedFromUserId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "task_status", nullable = false, length = 50)
    private WorkflowTaskStatus taskStatus = WorkflowTaskStatus.PENDING;

    @Column(name = "action_taken", length = 50)
    private String actionTaken;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @Column(name = "due_at")
    private LocalDateTime dueAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_by")
    private UUID completedBy;

    @Column(name = "completed_by_name")
    private String completedByName;

    @Column(name = "comments", columnDefinition = "text")
    private String comments;

    /** Optimistic locking — prevents two users from approving the same task */
    @Builder.Default
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (assignedAt == null) {
            assignedAt = LocalDateTime.now();
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (taskStatus == null) {
            taskStatus = WorkflowTaskStatus.PENDING;
        }
        if (version == null) {
            version = 0L;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
}
