package com.erp.inventory.modules.serial.dto.request;

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
public class ProductSerialRequest {
    @NotNull(message = "productId is required")
    private UUID productId;
    @NotNull(message = "batchId is required")
    private UUID batchId;
    @Size(max = 255, message = "serialNumber must not exceed 255 characters")
    private String serialNumber;
    private String status;
    private LocalDate purchaseDate;
    private LocalDate warrantyStartDate;
    private LocalDate warrantyEndDate;
}
