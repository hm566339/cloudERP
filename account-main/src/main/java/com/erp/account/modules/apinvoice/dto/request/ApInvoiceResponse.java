package com.erp.account.modules.apinvoice.dto.request;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.GstTreatment;
import com.erp.account.enums.ItcEligibility;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.PurchaseDocumentType;
import com.erp.account.enums.PurchaseNature;
import com.erp.account.enums.PurchaseSource;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.util.Invoice;


/**
 * DTO for AP Invoice Response
 * 
 * Comprehensive invoice details for API responses
 * - Invoice header information
 * - Vendor details
 * - Payment summary
 * - GL posting details
 * - Approval and audit information
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ApInvoiceResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    // ============================================================
    // INVOICE IDENTIFICATION
    // ============================================================

    /**
     * Invoice ID
     */
    private UUID id;

    /**
     * Invoice number
     */
    private String invoiceNo;

    /**
     * Invoice status
     */
    private InvoiceStatus status;

    // ============================================================
    // COMPANY & VENDOR DETAILS
    // ============================================================

    /**
     * Company ID
     */
    private UUID companyId;

    /**
     * Company name
     */
    private String companyName;

    /**
     * Vendor ID
     */
    private UUID vendorId;

    /**
     * Vendor code
     */
    private String vendorCode;

    /**
     * Vendor name
     */
    private String vendorName;

    /**
     * Vendor GSTIN
     */
    private String vendorGstin;

    /**
     * Vendor PAN
     */
    private String vendorPan;

    // ============================================================
    // INVOICE DATES
    // ============================================================

    /**
     * Invoice date
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate invoiceDate;

    /**
     * Due date
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    /**
     * Days overdue (calculated, 0 if not overdue)
     */
    private int daysOverdue;

    // ============================================================
    // CURRENCY & EXCHANGE
    // ============================================================

    /**
     * Invoice currency
     */
    private String invoiceCurrency;

    /**
     * Exchange rate (if multi-currency)
     */
    private BigDecimal exchangeRate;

    /**
     * Base currency equivalent
     */
    private BigDecimal baseCurrencyTotal;

    // ============================================================
    // FINANCIAL AMOUNTS
    // ============================================================

    /**
     * Subtotal of all items
     */
    private BigDecimal subtotal;

    /**
     * Total tax amount (CGST + SGST/IGST)
     */
    private BigDecimal taxAmount;

    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal cessAmount;
    private UUID inputCgstAccountId;
    private UUID inputSgstAccountId;
    private UUID inputIgstAccountId;
    private UUID inputCessAccountId;

    /**
     * TDS amount
     */
    private BigDecimal tdsAmount;

    /**
     * Freight Charges
     */
    private BigDecimal freightCharges;

    /**
     * Total before round off (subtotal + tax - tds + freight)
     */
    private BigDecimal totalBeforeRoundOff;

    /**
     * Round off amount
     */
    private BigDecimal roundOff;

    /**
     * Total invoice amount (totalBeforeRoundOff + roundOff)
     */
    private BigDecimal totalAmount;

    // ============================================================
    // ADDRESS & POS DETAILS
    // ============================================================
    private UUID placeOfSupplyStateId;
    private String placeOfSupplyStateCode;

    private UUID vendorAddressId;
    private String purchaseAddressLine1;
    private String purchaseAddressLine2;
    private String purchaseCity;
    private String purchaseState;
    private String purchaseCountry;
    private String purchasePostalCode;

    /**
     * Amount paid to date
     */
    private BigDecimal paidAmount;

    /**
     * Outstanding balance
     */
    private BigDecimal outstandingAmount;

    /**
     * Payment percentage (paidAmount / totalAmount * 100)
     */
    private BigDecimal paymentPercentage;

    // ============================================================
    // LINE ITEMS
    // ============================================================

    /**
     * Invoice line items
     */
    private List<ApInvoiceItemResponse> items;

    /**
     * Count of line items
     */
    private int itemCount;

    // ============================================================
    // APPROVAL INFORMATION
    // ============================================================

    /**
     * User ID who approved the invoice
     */
    private UUID approvedBy;

    /**
     * Approval timestamp
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime approvedAt;

    /**
     * Approval status indicator
     */
    private String approvalStatus;

    // ============================================================
    // GL POSTING INFORMATION
    // ============================================================

    /**
     * GL journal entry ID (if posted)
     */
    private UUID glJournalEntryId;

    private UUID reverseGlJournalEntryId;

    /**
     * GL posting status
     */
    private String glPostingStatus;

    /**
     * GL posting timestamp
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime glPostingTime;

    // ============================================================
    // AUDIT INFORMATION
    // ============================================================

    /**
     * Created by user ID
     */
    private UUID createdBy;

    /**
     * Creation timestamp
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * Last updated by user ID
     */
    private UUID updatedBy;

    /**
     * Last update timestamp
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // ============================================================
    // ADDITIONAL DETAILS
    // ============================================================

    /**
     * Notes/narration
     */
    private String notes;

    /**
     * Indicates if invoice can be edited
     */
    private boolean editable;

    /**
     * Indicates if invoice can be deleted
     */
    private boolean deletable;

    /**
     * Indicates if invoice can be approved
     */
    private boolean approvable;

    /**
     * Indicates if invoice can be posted
     */
    private boolean postable;

    /**
     * Indicates if invoice can be paid
     */
    private boolean payable;

    private UUID purchaseOrderId;

    private UUID goodsReceiptId;

    private PurchaseSource purchaseSource;

    private PurchaseDocumentType documentType;

    private PurchaseNature purchaseNature;

    private PaymentType paymentType;

    private GstTreatment gstTreatment;

    private ItcEligibility itcEligibility;

    private String itcReason;

    private String supplierInvoiceNumber;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate supplierInvoiceDate;
}
