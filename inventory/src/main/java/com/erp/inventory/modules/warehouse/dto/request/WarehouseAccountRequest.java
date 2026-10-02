package com.erp.inventory.modules.warehouse.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * WarehouseAccountRequest
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseAccountRequest {

    @NotNull(message = "Warehouse Id is required")
    private UUID warehouseId;

    @NotNull(message = "Warehouse Location is required")
    private UUID warehouseLocationId;

}
