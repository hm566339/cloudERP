package com.erp.account.modules.purchasereturn.dto;

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
public class PurchaseReturnRequest {

    @NotNull(message = "Goods Receipt ID is required")
    private UUID goodsReceiptId;

    private LocalDate returnDate;

    private String reason;

    private String notes;

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<PurchaseReturnItemRequest> items;
}
