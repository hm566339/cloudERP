package com.erp.account.modules.salesorder.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SOItemConversionRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "PI Item ID is required")
    private UUID piItemId;

    @NotNull(message = "Conversion quantity is required")
    private BigDecimal quantity;
}
