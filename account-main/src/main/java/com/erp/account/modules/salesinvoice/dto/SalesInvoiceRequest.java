package com.erp.account.modules.salesinvoice.dto;

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
 * Request DTO for Sales Invoice
 * 
 * Validates and transfers invoice data from API request to service layer.
 * Includes comprehensive business rule validations for:
 * - Customer and company validation
 * - Date validations (invoice date, due date)
 * - Amount validations and calculations
 * - Currency and exchange rate validations
 * - GST compliance checks
 * 
 * @author ERP System
 * @since 1.0.0
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request model for Sales Invoice")
public class SalesInvoiceRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    // ============================================================
    // COMPANY & CUSTOMER - MANDATORY
    // ============================================================

    @NotNull(message = "Customer ID is mandatory")
    @Schema(description = "Customer ID (must belong to same company)", requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID customerId;

    @Schema(description = "Existing Delivery Address ID (from customer address book)")
    private UUID deliveryAddressId;

    @Schema(description = "New delivery address to create and use for this invoice")
    @Valid
    private CustomerAddressRequest newDeliveryAddress;

    @Schema(description = "If true, save the newDeliveryAddress to the customer's profile")
    private Boolean saveNewDeliveryAddress;

    // ============================================================
    // INVOICE IDENTIFICATION - MANDATORY
    // ============================================================

    @Size(max = 50, message = "Invoice number must be up to 50 characters")
    @Pattern(regexp = "^[A-Z0-9/-]*$", message = "Invoice number must contain only uppercase letters, numbers, /, or -")
    @Schema(description = "Unique invoice number per company (e.g., INV-2026-001). Auto-generated if not provided.", requiredMode = Schema.RequiredMode.NOT_REQUIRED, example = "INV-2026-001")
    private String invoiceNumber;

    @Schema(description = "ID of the Sales Order from which this invoice is generated, if any")
    private UUID sourceSalesOrderId;

    @Schema(description = "Number of the Sales Order from which this invoice is generated, if any")
    private String sourceSalesOrderNumber;

    @Schema(description = "ID of the Delivery Challan from which this invoice is generated, if any")
    private UUID sourceDeliveryChallanId;

    @Schema(description = "Number of the Delivery Challan from which this invoice is generated, if any")
    private String sourceDeliveryChallanNumber;

    // ============================================================
    // INVOICE DATES - MANDATORY
    // ============================================================

    @NotNull(message = "Invoice date is mandatory")
    @PastOrPresent(message = "Invoice date cannot be in the future")
    @Schema(description = "Invoice generation date", requiredMode = Schema.RequiredMode.REQUIRED, example = "2026-05-26")
    private LocalDate invoiceDate;

    @NotNull(message = "Due date is mandatory")
    @Schema(description = "Payment due date (must be >= invoice date)", requiredMode = Schema.RequiredMode.REQUIRED, example = "2026-06-25")
    private LocalDate dueDate;

    // ============================================================
    // CURRENCY & EXCHANGE RATE
    // ============================================================

    @Size(min = 3, max = 3, message = "Currency code must be 3 characters (e.g., USD, EUR, INR)")
    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency code must be 3 uppercase letters")
    @Schema(description = "Invoice currency code (optional, uses company base currency if not provided)", example = "INR")
    private String invoiceCurrency;

    @DecimalMin(value = "0.000001", message = "Exchange rate must be greater than 0")
    @Digits(integer = 13, fraction = 6, message = "Exchange rate precision: 13 integer digits, 6 decimal places")
    @Schema(description = "Exchange rate if invoiceCurrency differs from company base currency " +
            "(precision: 13 integer, 6 decimal)", example = "1.000000")
    private BigDecimal exchangeRate;

    // ============================================================
    // INVOICE AMOUNTS - (Calculated by backend)
    // ============================================================
    // Subtotal, tax amount, total amount, and outstanding amount are now purely
    // calculated by the backend.

    @PositiveOrZero(message = "Freight charges cannot be negative")
    @DecimalMin(value = "0.0000", message = "Freight charges cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Freight charges precision: 15 integer digits, 4 decimal places")
    @Schema(description = "Freight or shipping charges to be added to the invoice (default: 0)", example = "150.50")
    private BigDecimal freightCharges;

    @PositiveOrZero(message = "Other charges cannot be negative")
    @DecimalMin(value = "0.0000", message = "Other charges cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Other charges precision: 15 integer digits, 4 decimal places")
    @Schema(description = "Additional or other charges (default: 0)", example = "50.00")
    private BigDecimal otherCharges;

    // ============================================================
    // PAYMENT TRACKING (OPTIONAL AT CREATION)
    // ============================================================

    @DecimalMin(value = "0.0000", message = "Received amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Received amount precision: 15 integer digits, 4 decimal places")
    @Schema(description = "Amount already received (default: 0)", example = "0.0000")
    private BigDecimal receivedAmount;

    // ============================================================
    // GST & TAX DETAILS
    // ============================================================

    @NotNull(message = "Place of Supply State ID is required")
    @Schema(description = "UUID of the GST State for Place of Supply", requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID placeOfSupplyStateId;

    // ============================================================
    // LINE ITEMS - MANDATORY
    // ============================================================

    @NotEmpty(message = "At least one line item is mandatory")
    @Size(min = 1, max = 100, message = "Invoice can have minimum 1 and maximum 100 line items")
    @Valid
    @Schema(description = "Invoice line items (minimum 1 required)", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<SalesInvoiceItemRequest> items;

    // ============================================================
    // ADDITIONAL DETAILS
    // ============================================================

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    @Schema(description = "Invoice-level notes or remarks")
    private String notes;

    private UUID paymentTermId;
    private String paymentTerms;
    private UUID termsConditionId;
    private String termsAndConditions;
    private String deliveryTerms;
}
