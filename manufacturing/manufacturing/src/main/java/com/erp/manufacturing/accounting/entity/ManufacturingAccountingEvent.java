package com.erp.manufacturing.accounting.entity;

import com.erp.manufacturing.accounting.enums.AccountingEventStatus;
import com.erp.manufacturing.common.enums.OutboxEventType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "manufacturing_accounting_event", uniqueConstraints = {
        @UniqueConstraint(name = "uk_mfg_acct_source", columnNames = {"company_id", "source_module", "source_id", "event_type"}),
        @UniqueConstraint(name = "uk_mfg_acct_idempotency", columnNames = {"company_id", "source_module", "idempotency_key"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManufacturingAccountingEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "production_order_id", nullable = false)
    private UUID productionOrderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 60)
    private OutboxEventType eventType;

    @Column(name = "source_module", nullable = false, length = 30)
    private String sourceModule;

    @Column(name = "source_id", nullable = false)
    private UUID sourceId;

    @Column(name = "reference_no", length = 100)
    private String referenceNo;

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal amount;

    @Column(name = "currency_code", nullable = false, length = 10)
    private String currencyCode;

    @Column(name = "idempotency_key", nullable = false, length = 200)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AccountingEventStatus status;

    @Column(name = "journal_entry_id")
    private UUID journalEntryId;

    @Column(name = "last_error", columnDefinition = "text")
    private String lastError;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
