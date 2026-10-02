package com.erp.inventory.modules.reservation.dto.request;

import lombok.Data;
import com.erp.inventory.modules.product.enums.ReferenceType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class StockReservationFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private String reservationNo;
    private UUID productId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private ReferenceType referenceType;
    private UUID referenceId;
    private UUID referenceLineId;
    private BigDecimal reservedQuantity;
    private BigDecimal releasedQuantity;
    private String status;
    private LocalDateTime expiresAt;
}
