package com.erp.account.modules.purchasereturn.dto;

import com.erp.account.modules.purchasereturn.entity.PurchaseReturnStatus;
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
public class PurchaseReturnResponse {

    private UUID id;
    private UUID companyId;
    private String returnNumber;
    private LocalDate returnDate;
    private UUID goodsReceiptId;
    private String grnNumber;
    private UUID purchaseOrderId;
    private String poNumber;
    private UUID vendorId;
    private String vendorName;
    private PurchaseReturnStatus status;
    private String reason;
    private String notes;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private List<PurchaseReturnItemResponse> items;

    // Lifecycle audit fields
    private UUID confirmedBy;
    private LocalDateTime confirmedAt;
    private UUID cancelledBy;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private UUID debitNoteId;

    private LocalDateTime createdAt;
    private String createdByUsername;
}

