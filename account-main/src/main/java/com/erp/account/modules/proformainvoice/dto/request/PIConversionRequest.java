package com.erp.account.modules.proformainvoice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import com.erp.account.enums.PaymentMode;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request model for converting a Quotation into a Proforma Invoice")
public class PIConversionRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "PI date is mandatory")
    @Schema(description = "Proforma Invoice generation date", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalDate piDate;

    @NotNull(message = "PI valid until date is mandatory")
    @Schema(description = "Proforma Invoice validity expiry date", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalDate piValidTill;

    @Schema(description = "Indicates if advance payment is required")
    @Builder.Default
    private Boolean advanceRequired = false;

    @DecimalMin(value = "0.0", message = "Advance amount cannot be negative")
    @Schema(description = "The required advance amount (should not exceed grand total)")
    private BigDecimal advanceAmount;

    @Schema(description = "Bank Account ID where payment is expected")
    private UUID bankAccountId;

    @Schema(description = "Additional payment condition or notes specific to PI")
    private String paymentCondition;

    @Schema(description = "Method of advance payment if received at creation")
    private PaymentMode paymentMode;

    @Schema(description = "GL Account ID for Accounts Receivable (required if auto-creating receipt)")
    private UUID receivableAccountId;

    @Schema(description = "GL Account ID where funds are received (e.g., Bank) (required if auto-creating receipt)")
    private UUID receiptAccountId;
}
