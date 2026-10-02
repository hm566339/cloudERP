package com.erp.inventory.modules.product.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class ProductCategoryFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private UUID parentCategoryId;
    private String code;
    private String name;
    private String description;
    private Boolean isActive;
}
