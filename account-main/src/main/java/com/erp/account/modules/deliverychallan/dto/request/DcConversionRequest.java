package com.erp.account.modules.deliverychallan.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for creating a Delivery Challan from a confirmed Sales Order")
public class DcConversionRequest {

    @NotNull(message = "Source Sales Order ID is required")
    @Schema(description = "ID of the CONFIRMED Sales Order to dispatch from", requiredMode = Schema.RequiredMode.REQUIRED, example = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
    private UUID sourceSalesOrderId;

    @NotNull(message = "Warehouse ID is required")
    @Schema(description = "ID of the warehouse from which items will be dispatched", requiredMode = Schema.RequiredMode.REQUIRED, example = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22")
    private UUID warehouseId;

    // Optional: If provided, only these items/quantities will be converted (partial dispatch).
    // If null or empty, it will do a full conversion of the remaining open quantities.
    @Valid
    @Schema(description = "Optional list of items to dispatch for partial conversion. If null or empty, all remaining open quantities are dispatched.")
    private List<DcConversionItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Line item dispatch details for partial conversion")
    public static class DcConversionItemRequest {

        @NotNull(message = "Sales Order Item ID is required")
        @Schema(description = "ID of the Sales Order Item being dispatched", requiredMode = Schema.RequiredMode.REQUIRED, example = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33")
        private UUID sourceSalesOrderItemId;

        // Optional item-level warehouse location override.
        @Schema(description = "Optional warehouse location ID within the selected warehouse", example = "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44")
        private UUID warehouseLocationId;

        @NotNull(message = "Quantity to dispatch is required")
        @Positive(message = "Quantity to dispatch must be greater than zero")
        @Schema(description = "Quantity to dispatch from this Sales Order Item", requiredMode = Schema.RequiredMode.REQUIRED, example = "10.0000")
        private BigDecimal quantityToDispatch;
    }
}
