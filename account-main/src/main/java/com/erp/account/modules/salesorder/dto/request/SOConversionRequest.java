package com.erp.account.modules.salesorder.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request model for converting a Proforma Invoice to Sales Order")
public class SOConversionRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "SO Date is mandatory")
    @Schema(description = "Sales Order Date", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalDate soDate;

    @NotEmpty(message = "At least one item is required for conversion")
    @Valid
    private List<SOItemConversionRequest> items;
}
