package com.erp.manufacturing.outbox.entity;

import com.erp.manufacturing.common.enums.*;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "manufacturing_outbox")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ManufacturingOutbox {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @Column(name = "aggregate_type", nullable = false) private String aggregateType;
    @Column(name = "aggregate_id", nullable = false) private UUID aggregateId;
    @Enumerated(EnumType.STRING) @Column(name = "event_type", nullable = false) private OutboxEventType eventType;
    @Column(name = "idempotency_key", nullable = false) private String idempotencyKey;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb") private JsonNode payload;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private OutboxStatus status;
    @Column(name = "retry_count", nullable = false) private Integer retryCount;
    @Column(name = "next_attempt_at") private LocalDateTime nextAttemptAt;
    @Column(name = "last_error", columnDefinition = "text") private String lastError;
    @Column(name = "processed_at") private LocalDateTime processedAt;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
}
