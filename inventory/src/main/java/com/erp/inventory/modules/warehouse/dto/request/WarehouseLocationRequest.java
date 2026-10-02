package com.erp.inventory.modules.warehouse.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.erp.inventory.modules.warehouse.enums.LocationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class WarehouseLocationRequest {
    @NotNull(message = "warehouseId is required")
    private UUID warehouseId;
    @NotNull(message = "parentLocationId is required")
    private UUID parentLocationId;
    @NotBlank(message = "locationName is required")
    @Size(max = 255, message = "locationName must not exceed 255 characters")
    private String locationName;
    @NotNull(message = "locationType is required")
    private LocationType locationType;
    private Boolean isActive;
}

