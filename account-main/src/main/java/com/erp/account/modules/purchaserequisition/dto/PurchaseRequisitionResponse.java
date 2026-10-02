package com.erp.account.modules.purchaserequisition.dto;

import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisitionStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionResponse {
    private UUID id;
    private UUID companyId;
    private String requisitionNumber;
    private UUID requesterId;
    @Schema(description = "Requester full name resolved from SSO using requesterId (read-only)", accessMode = Schema.AccessMode.READ_ONLY, example = "John Doe")
    private String requesterName;
    private UUID departmentId;
    private UUID costCenterId;
    private LocalDate requiredDate;
    private String priority;
    private String purpose;
    private String remarks;
    private PurchaseRequisitionStatus status;
    private UUID submittedBy;
    private LocalDateTime submittedAt;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private UUID rejectedBy;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private UUID cancelledBy;
    private LocalDateTime cancelledAt;
    private List<Item> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private UUID id;
        private UUID itemId;
        private String itemName;
        private String description;
        private BigDecimal requestedQuantity;
        private String unit;
        private BigDecimal estimatedUnitPrice;
        private BigDecimal estimatedAmount;
        private LocalDate requiredDate;
        private UUID warehouseId;
        private String warehouseName;
        private UUID locationId;
        private String locationName;
    }
}
