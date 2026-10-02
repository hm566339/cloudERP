package com.erp.account.modules.salesinvoice.dto;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.util.Invoice;


/**
 * Response DTO for Sales Invoice Line Item
 * 
 * Contains details for each line in the sales invoice:
 * - Item information (HSN/SAC, quantity, pricing)
 * - Tax calculation details
 * - Line-level totals
 * 
 * Multiple items per invoice, each with its own tax treatment
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesInvoiceItemResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    // ============================================================
    // LINE ITEM IDENTITY
    // ============================================================

    /** Unique line item ID */
    private UUID id;

    /** Sales invoice ID (parent) */
    private UUID salesInvoiceId;

    /** Item ID (from inventory/master data) - optional */
    private UUID itemId;

    /** HSN/SAC Code (Harmonized System of Nomenclature or Service Accounting Code) */
    private String hsnSacCode;

    /** HSN/SAC ID (foreign key to master) */
    private UUID hsnSacId;

    // ============================================================
    // ITEM DETAILS
    // ============================================================

    /** Item/Service name */
    private String itemName;

    /** Item description (e.g., specifications, SKU) */
    private String description;

    /** Item quantity (precision = 19, scale = 4) */
    private BigDecimal quantity;

    /** Unit of measure (e.g., "PCS", "KG", "SQM") */
    private String unit;

    /** Unit price (in invoice currency) */
    private BigDecimal unitPrice;

    // ============================================================
    // LINE ITEM AMOUNTS
    // ============================================================

    /** Taxable amount (quantity * unitPrice) before tax */
    private BigDecimal taxableAmount;

    /** Tax amount for this line (calculated based on rate and taxable_amount) */
    private BigDecimal taxAmount;

    /** Line item total (taxable_amount + tax_amount) */
    private BigDecimal totalAmount;

    // ============================================================
    // TAX DETAILS
    // ============================================================

    /** Tax rate percentage (e.g., 18 for 18% GST) */
    private BigDecimal taxRate;

    /** CGST percentage (e.g., 9 for 9%) - for intra-state */
    private BigDecimal cgstPercentage;

    /** SGST percentage (e.g., 9 for 9%) - for intra-state */
    private BigDecimal sgstPercentage;

    /** IGST percentage (e.g., 18 for 18%) - for inter-state */
    private BigDecimal igstPercentage;

    /** CGST amount for this line */
    private BigDecimal cgstAmount;

    /** SGST amount for this line */
    private BigDecimal sgstAmount;

    /** IGST amount for this line */
    private BigDecimal igstAmount;

    // ============================================================
    // COMPANY INFO
    // ============================================================

    /** Company ID (for multi-company isolation) */
    private UUID companyId;

    // ============================================================
    // DISCOUNTS & ADJUSTMENTS
    // ============================================================

    /** Discount percentage applied to this line (0-100) */
    private BigDecimal discountPercentage;

    // ============================================================
    // ADDITIONAL DETAILS
    // ============================================================

    /** Batch number (for inventory tracking) */
    private String batchNumber;

    /** Serial number (for high-value items) */
    private String serialNumber;

    /** Expiry date (if applicable) */
    private String expiryDate;

    /** Cost center or cost code (for GL posting) */
    private String costCenter;

    /** Line sequence number (1, 2, 3, ...) */
    private Integer lineNumber;

    /** Warehouse ID */
    private UUID warehouseId;

    /** Location ID within the warehouse */
    private UUID locationId;

    /** Line item remarks/notes */
    private String remarks;

}
