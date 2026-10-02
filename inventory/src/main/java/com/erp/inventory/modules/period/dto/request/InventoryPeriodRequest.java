package com.erp.inventory.modules.period.dto.request;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class InventoryPeriodRequest {
    @NotBlank(message = "periodName is required")
    @Size(max = 255, message = "periodName must not exceed 255 characters")
    private String periodName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private LocalDateTime closedAt;
    private UUID closedBy;
}
