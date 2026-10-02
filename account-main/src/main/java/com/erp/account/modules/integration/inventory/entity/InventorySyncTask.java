package com.erp.account.modules.integration.inventory.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_sync_task", indexes = {
        @Index(name = "idx_inv_sync_task_invoice", columnList = "invoice_id"),
        @Index(name = "idx_inv_sync_task_status", columnList = "status"),
        @Index(name = "idx_inv_sync_task_next_retry", columnList = "next_retry_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventorySyncTask extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;

    @Column(name = "invoice_id", nullable = false, updatable = false)
    private UUID invoiceId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // e.g., "STOCK_OUT"

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SyncStatus status;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private int retryCount = 0;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "token", columnDefinition = "TEXT")
    private String token;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    /**
     * Serialized JSON payload of the outbox event contract.
     * Populated at scheduling time so the worker can reconstruct the request
     * without needing to re-join all related entities.
     */
    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload;

}
