package com.erp.account.modules.salesinvoice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

import com.erp.account.util.Invoice;

/**
 * Request DTO for Sales Invoice Line Item
 * 
 * Validates and transfers line item data from API request to service layer.
 * Includes business rule validations for:
 * - Quantity and pricing validations
 * - Tax amount calculations
 * - Line-level totals
 * 
 * @author ERP System
 * @since 1.0.0
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request model for Sales Invoice Line Item")
public class SalesInvoiceItemRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    // ============================================================
    // ITEM REFERENCE
    // ============================================================

    @Schema(description = "Existing invoice line ID. Used during update to preserve line identity.")
    private UUID id;

    @Schema(description = "Item master ID (optional, for inventory reference)")
    private UUID itemId;

    @NotNull(message = "HSN/SAC code is mandatory for tax calculation")
    @Size(max = 15, message = "HSN/SAC code must not exceed 15 characters")
    @Schema(description = "HSN/SAC code for tax classification")
    private String hsnSacCode;

    // ============================================================
    // ITEM DETAILS - MANDATORY
    // ============================================================

    @Size(max = 255, message = "Item name must not exceed 255 characters")
    @Schema(description = "Item or service name (optional, defaults to description or item master name)")
    private String itemName;

    @Schema(description = "Detailed item description or specifications")
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    // ============================================================
    // QUANTITY & PRICING - MANDATORY
    // ============================================================

    @NotNull(message = "Quantity is mandatory")
    @DecimalMin(value = "0.0001", message = "Quantity must be greater than 0")
    @Digits(integer = 15, fraction = 4, message = "Quantity precision: 15 integer digits, 4 decimal places")
    @Schema(description = "Item quantity (4 decimal precision)", requiredMode = Schema.RequiredMode.REQUIRED, example = "10.0000")
    private BigDecimal quantity;

    @NotNull(message = "Unit price is mandatory")
    @DecimalMin(value = "0.0000", message = "Unit price cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Unit price precision: 15 integer digits, 4 decimal places")
    @Schema(description = "Unit price in invoice currency (4 decimal precision)", requiredMode = Schema.RequiredMode.REQUIRED, example = "100.0000")
    private BigDecimal unitPrice;

    // ============================================================
    // DISCOUNTS (OPTIONAL)
    // ============================================================

    @DecimalMin(value = "0.00", message = "Discount percentage cannot be negative")
    @DecimalMax(value = "100.00", message = "Discount percentage cannot exceed 100")
    @Digits(integer = 3, fraction = 2, message = "Discount percentage precision: 3 integer digits, 2 decimal places")
    @Schema(description = "Discount percentage (0-100)", example = "10.00")
    private BigDecimal discountPercentage;

    // ============================================================
    // TRANSIENT FIELDS (OPTIONAL)
    // ============================================================

    @Schema(description = "Unit of measure (e.g., PCS, KG, SQM)", example = "PCS")
    private String unit;

    // ============================================================
    // LINE NOTES (OPTIONAL)
    // ============================================================

    @Schema(description = "Warehouse ID where the item is stored")
    private UUID warehouseId;

    @Schema(description = "Location ID within the warehouse")
    private UUID locationId;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    @Schema(description = "Line-level notes or remarks")
    private String notes;

}
