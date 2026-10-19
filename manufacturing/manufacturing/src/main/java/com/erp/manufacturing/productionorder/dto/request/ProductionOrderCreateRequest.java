package com.erp.manufacturing.productionorder.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionOrderCreateRequest {
    private UUID companyId;
    private String productionOrderNo;
    private UUID finishedProductId;
    @NotNull(message = "BOM ID is required")
    private UUID bomId;
    private UUID bomRevisionId;
    @NotNull(message = "Warehouse ID is required")
    private UUID warehouseId;
    private UUID productionLocationId;
    @NotNull(message = "Planned quantity is required")
    @DecimalMin(value = "0.000001", message = "Planned quantity must be greater than zero")
    private BigDecimal plannedQuantity;
    private LocalDate plannedStartDate;
    private LocalDate plannedEndDate;
    private String priority;
    private String notes;
}
