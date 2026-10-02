package com.erp.account.modules.quotation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.erp.account.modules.customer.dto.request.CustomerAddressRequest;

/**
 * Request DTO for creating a Quotation
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request model for creating a Quotation")
public class QuotationCreateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "Customer ID is mandatory")
    @Schema(description = "Customer ID (must belong to same company)", requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID customerId;

    @Schema(description = "Existing Delivery Address ID")
    private UUID deliveryAddressId;

    @Schema(description = "New delivery address to create and use for this quotation")
    @Valid
    private CustomerAddressRequest newDeliveryAddress;

    @Schema(description = "If true, save the newDeliveryAddress to the customer's profile")
    private Boolean saveNewDeliveryAddress;

    @Size(max = 50, message = "Quotation number must be up to 50 characters")
    @Pattern(regexp = "^[A-Z0-9/-]*$", message = "Quotation number must contain only uppercase letters, numbers, /, or -")
    @Schema(description = "Unique quotation number per company. Auto-generated if not provided.", accessMode = Schema.AccessMode.READ_ONLY)
    private String quotationNumber;

    @NotNull(message = "Quotation date is mandatory")
    @PastOrPresent(message = "Quotation date cannot be in the future")
    @Schema(description = "Quotation generation date", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalDate quotationDate;

    @NotNull(message = "Valid until date is mandatory")
    @Schema(description = "Quotation validity expiry date", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalDate validUntil;

    @Size(max = 100, message = "Reference number must not exceed 100 characters")
    @Schema(description = "Customer RFQ or external reference number")
    private String referenceNumber;

    @Size(min = 3, max = 3, message = "Currency code must be 3 characters")
    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency code must be 3 uppercase letters")
    private String quotationCurrency;

    @DecimalMin(value = "0.000001", message = "Exchange rate must be greater than 0")
    @Digits(integer = 13, fraction = 6, message = "Exchange rate precision: 13 integer, 6 decimal")
    private BigDecimal exchangeRate;

    @PositiveOrZero(message = "Freight charges cannot be negative")
    @Digits(integer = 15, fraction = 4)
    private BigDecimal freightCharges;

    @PositiveOrZero(message = "Other charges cannot be negative")
    @Digits(integer = 15, fraction = 4)
    private BigDecimal otherCharges;

    @NotNull(message = "Place of Supply State ID is required")
    @Schema(description = "UUID of the GST State for Place of Supply", requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID placeOfSupplyStateId;

    @NotEmpty(message = "At least one line item is mandatory")
    @Size(min = 1, max = 100, message = "Quotation can have minimum 1 and maximum 100 line items")
    @Valid
    @Schema(description = "Quotation line items", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<QuotationItemRequest> items;

    @Schema(description = "Master Payment Term ID")
    private UUID paymentTermId;

    @Schema(description = "Payment terms text")
    private String paymentTerms;

    @Schema(description = "Master Delivery Term ID")
    private UUID deliveryTermId;

    @Schema(description = "Delivery terms text")
    private String deliveryTerms;

    @Schema(description = "Master Warranty Term ID")
    private UUID warrantyTermId;

    @Schema(description = "Warranty terms text")
    private String warrantyTerms;

    @Schema(description = "Master Terms & Condition ID")
    private UUID termsConditionId;

    @Schema(description = "Additional terms and conditions")
    private String termsAndConditions;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    @Schema(description = "Internal or external notes")
    private String notes;
}
