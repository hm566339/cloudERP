package com.erp.account.modules.goodsreceipt.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptRequest {

    private UUID purchaseOrderId;

    private String grnNumber;

    @NotNull(message = "GRN date is required")
    private LocalDate grnDate;

    private UUID warehouseId;

    private String deliveryNoteNumber;

    private LocalDate deliveryNoteDate;

    private String vehicleNumber;

    private String transporterName;

    private String notes;

    @Valid
    @NotEmpty(message = "At least one item is required in the Goods Receipt")
    private List<GoodsReceiptItemRequest> items;
}
