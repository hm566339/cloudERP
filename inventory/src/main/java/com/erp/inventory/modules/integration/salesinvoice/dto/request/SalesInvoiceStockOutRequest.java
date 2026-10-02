package com.erp.inventory.modules.integration.salesinvoice.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class SalesInvoiceStockOutRequest {

    @NotNull(message = "idempotencyKey is required")
    private UUID idempotencyKey;

    @NotNull(message = "companyId is required")
    private UUID companyId;

    @NotNull(message = "invoiceId is required")
    private UUID invoiceId;

    @NotBlank(message = "invoiceNumber is required")
    private String invoiceNumber;

    @NotNull(message = "invoiceDate is required")
    private LocalDate invoiceDate;

    @NotBlank(message = "movementType is required")
    private String movementType;

    @NotEmpty(message = "items cannot be empty")
    @Valid
    private List<SalesInvoiceStockOutItemRequest> items;
}

