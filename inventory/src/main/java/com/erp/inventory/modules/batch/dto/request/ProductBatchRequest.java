package com.erp.inventory.modules.batch.dto.request;

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
public class ProductBatchRequest {
    @NotNull(message = "productId is required")
    private UUID productId;
    @NotBlank(message = "batchNumber is required")
    @Size(max = 255, message = "batchNumber must not exceed 255 characters")
    private String batchNumber;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    @NotNull(message = "supplierId is required")
    private UUID supplierId;
    private String status;
}
