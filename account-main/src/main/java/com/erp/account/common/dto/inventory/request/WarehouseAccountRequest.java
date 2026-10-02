package com.erp.account.common.dto.inventory.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

/**
 * WarehouseAccountRequest
 */
@Data
@Builder
public class WarehouseAccountRequest {

    @NotNull(message = "Warehouse Id is required")
    private UUID warehouseId;

    @NotNull(message = "Warehouse Location is required")
    private UUID warehouseLocationId;

}
