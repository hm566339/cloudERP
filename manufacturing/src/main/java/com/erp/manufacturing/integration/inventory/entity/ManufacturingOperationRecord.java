package com.erp.manufacturing.integration.inventory.entity;

import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationStatus;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "manufacturing_operation_record", uniqueConstraints = {
        @UniqueConstraint(name = "uk_mfg_op_idempotency", columnNames = {"company_id", "operation_type", "idempotency_key"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManufacturingOperationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false, length = 60)
    private ManufacturingOperationType operationType;

    @Column(name = "business_id", nullable = false)
    private UUID businessId;

    @Column(name = "line_id")
    private UUID lineId;

    @Column(name = "idempotency_key", nullable = false, length = 255)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ManufacturingOperationStatus status;

    @Column(name = "inventory_reference_id")
    private UUID inventoryReferenceId;

    @Column(name = "request_payload", columnDefinition = "text")
    private String requestPayload;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Builder.Default
    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
