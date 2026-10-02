package com.erp.manufacturing.bom.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter
public class BomItemUpdateRequest {
    @NotNull private UUID componentProductId;
    @NotNull @PositiveOrZero private BigDecimal quantity;
    @NotNull private UUID uomId;
    @NotNull @PositiveOrZero private BigDecimal scrapPercentage;
    @NotNull @PositiveOrZero private BigDecimal wastagePercentage;
    @NotNull @PositiveOrZero private Integer sequenceNo;
    @NotNull private Boolean isOptional;
    @NotNull private Boolean isActive;
    private String notes;
}