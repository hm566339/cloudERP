package com.erp.workflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tracks outbound webhook callbacks sent to business services upon workflow state changes.
 * Enables retry of failed callbacks and provides audit trail.
 */
@Entity
@Table(name = "workflow_callback_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowCallbackLog {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_transaction_id", nullable = false)
    private WorkflowTransaction workflowTransaction;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "callback_url", nullable = false, length = 500)
    private String callbackUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_payload", columnDefinition = "jsonb")
    private String requestPayload;

    @Column(name = "response_status")
    private Integer responseStatus;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 1;

    @Column(name = "last_attempted_at", nullable = false)
    private LocalDateTime lastAttemptedAt;

    @Column(name = "succeeded", nullable = false)
    private Boolean succeeded = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (lastAttemptedAt == null) {
            lastAttemptedAt = LocalDateTime.now();
        }
        if (attemptCount == null) {
            attemptCount = 1;
        }
        if (succeeded == null) {
            succeeded = false;
        }
    }
}
