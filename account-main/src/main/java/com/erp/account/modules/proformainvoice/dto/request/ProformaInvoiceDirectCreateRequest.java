package com.erp.account.modules.proformainvoice.dto.request;

import com.erp.account.enums.PaymentMode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProformaInvoiceDirectCreateRequest {

    @NotNull(message = "PI Date is required")
    private LocalDate piDate;

    @NotNull(message = "PI Valid Till is required")
    private LocalDate piValidTill;

    @NotNull(message = "Customer is required")
    private UUID customerId;

    private Boolean advanceRequired;

    private BigDecimal advanceAmount;

    private UUID bankAccountId;

    @Schema(description = "Additional payment condition or notes specific to PI")
    private String paymentCondition;

    @Schema(description = "Method of advance payment if received at creation")
    private PaymentMode paymentMode;

    @Schema(description = "GL Account ID for Accounts Receivable (required if auto-creating receipt)")
    private UUID receivableAccountId;

    @Schema(description = "GL Account ID where funds are received (e.g., Bank) (required if auto-creating receipt)")
    private UUID receiptAccountId;

    private UUID paymentTermId;
    private String paymentTerms;

    private UUID termsConditionId;
    private String termsAndConditions;

    private String deliveryTerms;

    private String notes;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<DirectPIItemRequest> items;
}
