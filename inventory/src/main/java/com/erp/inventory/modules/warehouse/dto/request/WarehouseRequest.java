package com.erp.inventory.modules.warehouse.dto.request;

import lombok.Data;
import com.erp.inventory.modules.warehouse.enums.WarehouseType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class WarehouseRequest {
    @NotBlank(message = "warehouseName is required")
    @Size(max = 255, message = "warehouseName must not exceed 255 characters")
    private String warehouseName;
    @NotNull(message = "warehouseType is required")
    private WarehouseType warehouseType;
    @NotBlank(message = "addressLine1 is required")
    @Size(max = 255, message = "addressLine1 must not exceed 255 characters")
    private String addressLine1;
    private String addressLine2;
    @NotBlank(message = "city is required")
    @Size(max = 255, message = "city must not exceed 255 characters")
    private String city;
    @NotBlank(message = "state is required")
    @Size(max = 255, message = "state must not exceed 255 characters")
    private String state;
    @NotBlank(message = "country is required")
    @Size(max = 255, message = "country must not exceed 255 characters")
    private String country;
    @NotBlank(message = "pinCode is required")
    @Size(max = 255, message = "pinCode must not exceed 255 characters")
    private String pinCode;
    private String status;
}
