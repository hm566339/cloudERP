package com.erp.account.modules.goodsreceipt.dto;

import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptResponse {

    private UUID id;
    private UUID companyId;
    private UUID vendorId;
    private String vendorName;
    private UUID purchaseOrderId;
    private String poNumber;
    private String grnNumber;
    private LocalDate grnDate;
    private UUID warehouseId;
    private String warehouseName;
    private String deliveryNoteNumber;
    private LocalDate deliveryNoteDate;
    private String vehicleNumber;
    private String transporterName;
    private String notes;

    private GoodsReceiptStatus status;
    private UUID verifiedBy;
    private LocalDateTime verifiedAt;
    private UUID postedBy;
    private LocalDateTime postedAt;
    private UUID confirmedBy;
    private LocalDateTime confirmedAt;
    private UUID cancelledBy;
    private LocalDateTime cancelledAt;
    private String cancellationReason;

    private LocalDateTime createdAt;
    private UUID createdBy;
    private LocalDateTime updatedAt;
    private UUID updatedBy;

    private List<GoodsReceiptItemResponse> items;
}
