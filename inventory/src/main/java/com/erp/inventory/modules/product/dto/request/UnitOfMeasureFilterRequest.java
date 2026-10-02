package com.erp.inventory.modules.product.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class UnitOfMeasureFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private String code;
    private String name;
    private Integer decimalPlaces;
    private Boolean isActive;
}
