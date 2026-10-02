package com.erp.inventory.modules.period.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class InventorySnapshotRequest {
    @NotBlank(message = "snapshotScope is required")
    private String snapshotScope;
    
    @NotNull(message = "snapshotDate is required")
    private LocalDateTime snapshotDate;
}
