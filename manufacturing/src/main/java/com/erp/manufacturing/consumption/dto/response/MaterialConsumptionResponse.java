package com.erp.manufacturing.consumption.dto.response;

import com.erp.manufacturing.common.enums.ConsumptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialConsumptionResponse {
    private UUID materialConsumptionId;
    private UUID productionOrderId;
    private UUID productionOrderMaterialId;
    private UUID productId;
    private BigDecimal quantity;
    private UUID uomId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID inventoryMovementId;
    private UUID reservationId;
    private ConsumptionStatus status;
}
