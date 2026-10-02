package com.erp.account.modules.apinvoice.dto.request;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.enums.GstTreatment;
import com.erp.account.enums.ItcEligibility;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.PurchaseDocumentType;
import com.erp.account.enums.PurchaseNature;
import com.erp.account.enums.PurchaseSource;
import com.erp.account.modules.vendor.dto.request.VendorAddressRequest;
import com.erp.account.util.Invoice;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for AP Invoice Request
 * 
 * Validates AP invoice creation and update operations
 * - Vendor and company validation
 * - Invoice dates and amounts
 * - Payment terms and status
 * - Multi-currency support
 * - GST and tax calculations
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ApInvoiceRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Vendor ID (mandatory)
     * Must belong to same company
     */
    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    private UUID vendorAddressId;

    @Valid
    private VendorAddressRequest newVendorAddress;

    private Boolean saveNewVendorAddress;

    @NotNull(message = "Place of Supply State ID is required")
    private UUID placeOfSupplyStateId;

    /**
     * Invoice number (mandatory, unique per company)
     * Format: Vendor-provided invoice number
     */
    @Size(max = 50, message = "Invoice number cannot exceed 50 characters")
    private String invoiceNo;

    /**
     * Invoice date (mandatory)
     * Cannot be in future
     */
    @NotNull(message = "Invoice date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate invoiceDate;

    /**
     * Due date (mandatory)
     * Must be >= invoice date
     */
    @NotNull(message = "Due date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    /**
     * Invoice currency (optional)
     * If provided, exchange_rate is mandatory
     * Format: 3-letter currency code (USD, EUR, INR, etc.)
     */
    @Size(min = 3, max = 3, message = "Currency code must be 3 characters")
    private String invoiceCurrency;

    /**
     * Exchange rate (mandatory if invoice_currency != company.base_currency)
     * Must be greater than 0
     * Precision: 19 digits with 6 decimal places
     */
    @DecimalMin(value = "0.000001", message = "Exchange rate must be greater than 0")
    @Digits(integer = 13, fraction = 6, message = "Exchange rate must have maximum 13 digits with 6 decimal places")
    private BigDecimal exchangeRate;

    /**
     * Subtotal of all invoice items
     * Must be >= 0
     */
    @NotNull(message = "Subtotal is required")
    @DecimalMin(value = "0", message = "Subtotal cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Subtotal must have maximum 15 digits with 4 decimal places")
    private BigDecimal subtotal;

    /**
     * Total tax amount (CGST + SGST/IGST)
     * Must be >= 0
     */
    @NotNull(message = "Tax amount is required")
    @DecimalMin(value = "0", message = "Tax amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Tax amount must have maximum 15 digits with 4 decimal places")
    private BigDecimal taxAmount;

    @DecimalMin(value = "0", message = "Freight charges cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Freight charges must have maximum 15 digits with 4 decimal places")
    private BigDecimal freightCharges = BigDecimal.ZERO;

    private BigDecimal cgstAmount = BigDecimal.ZERO;
    private BigDecimal sgstAmount = BigDecimal.ZERO;
    private BigDecimal igstAmount = BigDecimal.ZERO;
    private BigDecimal cessAmount = BigDecimal.ZERO;
    private UUID inputCgstAccountId;
    private UUID inputSgstAccountId;
    private UUID inputIgstAccountId;
    private UUID inputCessAccountId;

    /**
     * TDS (Tax Deducted at Source)
     * Optional, must be >= 0
     */
    @DecimalMin(value = "0", message = "TDS amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "TDS amount must have maximum 15 digits with 4 decimal places")
    private BigDecimal tdsAmount = BigDecimal.ZERO;

    /**
     * Total invoice amount
     * Calculated: subtotal + tax - tds
     * Must be > 0
     */
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.01", message = "Total amount must be greater than 0")
    @Digits(integer = 15, fraction = 4, message = "Total amount must have maximum 15 digits with 4 decimal places")
    private BigDecimal totalAmount;

    /**
     * Paid amount (defaults to 0)
     * Cannot exceed total_amount
     */
    @DecimalMin(value = "0", message = "Paid amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Paid amount must have maximum 15 digits with 4 decimal places")
    private BigDecimal paidAmount = BigDecimal.ZERO;

    /**
     * Outstanding amount
     * Calculated: total - paid
     */
    @DecimalMin(value = "0", message = "Outstanding amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Outstanding amount must have maximum 15 digits with 4 decimal places")
    private BigDecimal outstandingAmount;

    /**
     * Invoice line items (at least 1 required)
     */
    @NotEmpty(message = "At least one invoice item is required")
    @Valid
    private List<ApInvoiceItemRequest> items;

    /**
     * Additional notes/narration for the invoice
     * Optional, max 2000 characters
     */
    @Size(max = 2000, message = "Notes cannot exceed 2000 characters")
    private String notes;

    private UUID purchaseOrderId;

    private UUID goodsReceiptId;

    private PurchaseSource purchaseSource;

    private PurchaseDocumentType documentType;

    private PurchaseNature purchaseNature;

    private PaymentType paymentType;

    private GstTreatment gstTreatment;

    private ItcEligibility itcEligibility;

    @Size(max = 500, message = "ITC reason cannot exceed 500 characters")
    private String itcReason;

    @Size(max = 100, message = "Supplier invoice number cannot exceed 100 characters")
    private String supplierInvoiceNumber;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate supplierInvoiceDate;

    private Boolean allowVariance;

    @AssertTrue(message = "Due date must be on or after invoice date")
    public boolean isDueDateValid() {
        return invoiceDate == null || dueDate == null || !dueDate.isBefore(invoiceDate);
    }
}
