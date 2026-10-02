package com.erp.inventory.modules.integration.deliverychallan.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryChallanStockOutRequest {

    @NotNull(message = "idempotencyKey is required")
    private UUID idempotencyKey;

    @NotNull(message = "companyId is required")
    private UUID companyId;

    @NotNull(message = "deliveryChallanId is required")
    private UUID deliveryChallanId;

    @NotBlank(message = "dcNumber is required")
    private String dcNumber;

    @NotNull(message = "dcDate is required")
    private LocalDate dcDate;

    @NotBlank(message = "movementType is required")
    private String movementType;

    @NotEmpty(message = "items cannot be empty")
    @Valid
    private List<DeliveryChallanStockOutItemRequest> items;
}
