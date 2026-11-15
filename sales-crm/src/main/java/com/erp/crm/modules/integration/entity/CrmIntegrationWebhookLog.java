package com.erp.crm.modules.integration.entity;

import com.erp.crm.modules.integration.enums.IntegrationProvider;
import com.erp.crm.modules.integration.enums.WebhookProcessingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_integration_webhook_log", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_webhook_company_idempotency", columnNames = {"company_id", "idempotency_hash"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmIntegrationWebhookLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "tenant_integration_id")
    private UUID tenantIntegrationId;

    @Enumerated(EnumType.STRING)
        @Column(name = "provider_code", nullable = false)
    private IntegrationProvider providerCode;

    @Column(name = "external_event_id", length = 255)
    private String externalEventId;

    @Column(name = "source_ip", length = 64)
    private String sourceIp;

    @Column(name = "headers_json", columnDefinition = "text")
    private String headersJson;

    @Column(name = "raw_payload", nullable = false, columnDefinition = "text")
    private String rawPayload;

    @Column(name = "idempotency_hash", nullable = false, length = 64)
    private String idempotencyHash;

    @Enumerated(EnumType.STRING)
        @Column(name = "processing_status", nullable = false)
    @Builder.Default
    private WebhookProcessingStatus processingStatus = WebhookProcessingStatus.RECEIVED;

    @Builder.Default
    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Builder.Default
    @Column(name = "max_retries", nullable = false)
    private Integer maxRetries = 3;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @Column(name = "lead_id")
    private UUID leadId;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
