package com.erp.inventory.modules.warehouse.dto.request;

import lombok.Data;
import com.erp.inventory.modules.warehouse.enums.WarehouseType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class WarehouseFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private String warehouseCode;
    private String warehouseName;
    private WarehouseType warehouseType;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private String status;
}
