package com.erp.crm.modules.automation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_automation_execution_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmAutomationExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "rule_id", nullable = false)
    private UUID ruleId;

    @Column(name = "action_id")
    private UUID actionId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "SUCCESS";

    @CreationTimestamp
    @Column(name = "executed_at", updatable = false)
    private LocalDateTime executedAt;

    @Builder.Default
    @Column(name = "duration_ms", nullable = false)
    private Long durationMs = 0L;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "execution_context_json", columnDefinition = "text")
    private String executionContextJson;
}

