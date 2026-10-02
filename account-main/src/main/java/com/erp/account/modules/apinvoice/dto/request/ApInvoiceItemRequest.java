package com.erp.account.modules.apinvoice.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import com.erp.account.modules.apinvoice.validator.ValidApInvoiceItem;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

import com.erp.account.util.Invoice;


/**
 * DTO for AP Invoice Line Item Request
 * 
 * Validates line item details for AP invoices
 * - Quantity and pricing
 * - Tax calculations
 * - Amount validations
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@ValidApInvoiceItem
public class ApInvoiceItemRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Item Master ID (optional - for linked items)
     */
    private UUID itemId;

    /**
     * Item Type: PRODUCT or EXPENSE
     */
    @NotNull(message = "Item type is required")
    private com.erp.account.enums.ItemType itemType;

    /**
     * Warehouse ID for PRODUCT items
     */
    private UUID warehouseId;

    /**
     * Location ID for PRODUCT items
     */
    private UUID locationId;

    /**
     * Unit of measurement
     */
    private String unit;

    /**
     * Line item description
     * Required, max 500 characters
     */
    @NotBlank(message = "Item description is required")
    @Size(max = 500, message = "Item description cannot exceed 500 characters")
    private String description;

    /**
     * Quantity of the item
     * Required, must be positive
     */
    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
    @Digits(integer = 15, fraction = 4, message = "Quantity must have maximum 15 digits with 4 decimal places")
    private BigDecimal quantity;

    /**
     * Unit price of the item
     * Required, must be non-negative
     */
    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0", message = "Unit price cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Unit price must have maximum 15 digits with 4 decimal places")
    private BigDecimal unitPrice;

    /**
     * Taxable amount for the line item
     * Calculated server-side from quantity and unit price
     */
    @DecimalMin(value = "0", message = "Taxable amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Taxable amount must have maximum 15 digits with 4 decimal places")
    private BigDecimal taxableAmount;

    /**
     * Tax amount for the line item
     * Required, must be non-negative
     */
    @NotNull(message = "Tax amount is required")
    @DecimalMin(value = "0", message = "Tax amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Tax amount must have maximum 15 digits with 4 decimal places")
    private BigDecimal taxAmount;

    /**
     * Expense account for the line item
     * Required for EXPENSE type
     */
    private UUID expenseAccountId;

    /**
     * Total amount (taxable + tax) for the line item
     * Calculated server-side
     */
    @DecimalMin(value = "0", message = "Total amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Total amount must have maximum 15 digits with 4 decimal places")
    private BigDecimal totalAmount;

    /**
     * HSN/SAC ID for GST calculation
     */
    private UUID hsnSacId;
}
