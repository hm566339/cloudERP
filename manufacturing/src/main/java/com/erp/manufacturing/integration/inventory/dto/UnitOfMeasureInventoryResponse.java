package com.erp.manufacturing.integration.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnitOfMeasureInventoryResponse {
    private UUID id;
    private UUID companyId;
    private String code;
    private String name;
    private Integer decimalPlaces;
    private Boolean isActive;
}