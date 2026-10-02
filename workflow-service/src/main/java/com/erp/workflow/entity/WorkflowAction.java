package com.erp.workflow.entity;

import com.erp.workflow.enums.WorkflowActionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Immutable append-only audit record of every workflow action.
 * Never updated or soft-deleted — permanent record.
 */
@Entity
@Table(name = "workflow_action")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowAction {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_transaction_id", nullable = false)
    private WorkflowTransaction workflowTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_task_id")
    private WorkflowTask workflowTask;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50)
    private WorkflowActionType actionType;

    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    @Column(name = "performed_by_name")
    private String performedByName;

    @Column(name = "previous_status", length = 50)
    private String previousStatus;

    @Column(name = "new_status", length = 50)
    private String newStatus;

    @Column(name = "comments", columnDefinition = "text")
    private String comments;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
