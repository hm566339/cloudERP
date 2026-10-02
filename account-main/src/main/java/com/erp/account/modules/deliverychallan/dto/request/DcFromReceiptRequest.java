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
@Schema(description = "Request payload for creating a Delivery Challan from a Receipt Voucher")
public class DcFromReceiptRequest {

    @NotNull(message = "Warehouse ID is required")
    @Schema(description = "ID of the warehouse from which items will be dispatched", requiredMode = Schema.RequiredMode.REQUIRED, example = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22")
    private UUID warehouseId;

    @Schema(description = "Optional default warehouse location ID within the selected warehouse", example = "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44")
    private UUID locationId;

    @Schema(description = "Optional Sales Invoice ID if the Receipt Voucher is allocated across multiple Sales Invoices", example = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
    private UUID salesInvoiceId;

    @Valid
    @Schema(description = "Optional list of items to dispatch for partial conversion. If null or empty, all remaining unfulfilled items are dispatched.")
    private List<DcFromReceiptItemRequest> items;

    @Schema(hidden = true)
    private DcFromReceiptRequest data;

    public DcFromReceiptRequest unwrap() {
        return this.data != null ? this.data : this;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Line item dispatch details for partial conversion from Sales Invoice")
    public static class DcFromReceiptItemRequest {

        @NotNull(message = "Sales Invoice Item ID is required")
        @Schema(description = "ID of the Sales Invoice Item being dispatched", requiredMode = Schema.RequiredMode.REQUIRED, example = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33")
        private UUID sourceSalesInvoiceItemId;

        @Schema(description = "Optional warehouse location ID within the selected warehouse", example = "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44")
        private UUID warehouseLocationId;

        @NotNull(message = "Quantity to dispatch is required")
        @Positive(message = "Quantity to dispatch must be greater than zero")
        @Schema(description = "Quantity to dispatch from this Sales Invoice Item", requiredMode = Schema.RequiredMode.REQUIRED, example = "5.0000")
        private BigDecimal quantityToDispatch;
    }
}
