package com.erp.account.modules.salesinvoice.dto;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.util.Invoice;


/**
 * Response DTO for Sales Invoice
 * 
 * Contains complete invoice information including:
 * - Billing details (customer, dates, amounts)
 * - Line items with taxes
 * - Payment tracking (received, outstanding)
 * - GL posting status
 * - Approval workflow status
 * - Audit information
 * - Currency and exchange rate details
 * 
 * Used for API responses to provide comprehensive invoice view
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesInvoiceResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    // ============================================================
    // INVOICE IDENTITY
    // ============================================================

    /** Unique invoice ID (UUID) */
    private UUID id;

    /** Invoice number (e.g., "INV-2026-001") - unique per company */
    private String invoiceNumber;

    /** Source Sales Order ID */
    private UUID salesOrderId;

    /** Source Sales Order Number */
    private String salesOrderNumber;

    /** Source Delivery Challan ID */
    private UUID deliveryChallanId;

    /** Source Delivery Challan Number */
    private String deliveryChallanNumber;

    /** Company ID (for access control verification) */
    private UUID companyId;

    /** Company name (for display) */
    private String companyName;
    /** Company GSTIN */
    private String companyGstin;

    /** Company state code */
    private String companyStateCode;

    /** Company base currency code (e.g., INR) */
    private String companyBaseCurrency;

    // ============================================================
    // CUSTOMER DETAILS
    // ============================================================

    /** Customer ID */
    private UUID customerId;

    /** Customer code (e.g., "CUST-001") */
    private String customerCode;

    /** Customer name */
    private String customerName;

    /** Customer GSTIN (GST Identification Number) */
    private String customerGstin;

    /** Customer email */
    private String customerEmail;

    /** Customer phone */
    private String customerPhone;

    /** Customer address */
    private String customerAddress;

    /** Customer city */
    private String customerCity;

    /** Customer state */
    private String customerState;

    /** Customer country */
    private String customerCountry;

    /** Customer state code */
    private String customerStateCode;

    // ============================================================
    // INVOICE DATES
    // ============================================================

    /** Invoice creation date */
    private LocalDate invoiceDate;

    /** Payment due date */
    private LocalDate dueDate;

    /** Number of days since invoice date (calculated for display) */
    private Long daysOverdue;

    // ============================================================
    // INVOICE AMOUNTS (in invoice currency)
    // ============================================================

    /** Line items subtotal (before tax) */
    private BigDecimal subtotal;

    /** Total tax amount (GST/Other) */
    private BigDecimal taxAmount;

    /** Freight Charges */
    private BigDecimal freightCharges;

    /** Additional or other charges */
    private BigDecimal otherCharges;

    /** Total before round off (subtotal + tax + freight + other charges) */
    private BigDecimal totalBeforeRoundOff;

    /** Round off amount */
    private BigDecimal roundOff;

    /** Total invoice amount (totalBeforeRoundOff + roundOff) */
    private BigDecimal totalAmount;

    /** Amount received from customer so far */
    private BigDecimal receivedAmount;

    /** Outstanding balance (totalAmount - receivedAmount) */
    private BigDecimal outstandingAmount;

    private PaymentStatus paymentStatus;

    private UUID receivableAccountId;

    private UUID revenueAccountId;

    private UUID outputCgstAccountId;
    private UUID outputSgstAccountId;
    private UUID outputIgstAccountId;
    private UUID outputCessAccountId;

    // ============================================================
    // CURRENCY & EXCHANGE
    // ============================================================

    /** Invoice currency code (e.g., "INR", "USD") - optional, defaults to company base */
    private String invoiceCurrency;

    /** Exchange rate if invoice_currency != company.base_currency (numeric(19,6)) */
    private BigDecimal exchangeRate;

    /** Base currency amount (if multi-currency) */
    private BigDecimal baseCurrencyAmount;

    // ============================================================
    // GST & TAX DETAILS
    // ============================================================

    private UUID placeOfSupplyStateId;
    private String placeOfSupplyStateCode;

    /** Place of supply (for GST purposes) - state/country code */
    private String placeOfSupply;

    // ============================================================
    // DELIVERY ADDRESS SNAPSHOT
    // ============================================================

    private UUID deliveryAddressId;
    private String deliveryAddressLine1;
    private String deliveryAddressLine2;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryCountry;
    private String deliveryPostalCode;

    /** CGST amount (Central GST) - for intra-state supply */
    private BigDecimal cgstAmount;

    /** SGST amount (State GST) - for intra-state supply */
    private BigDecimal sgstAmount;

    /** IGST amount (Integrated GST) - for inter-state supply */
    private BigDecimal igstAmount;

    /** Tax rate percentage applied */
    private BigDecimal taxRate;

    // ============================================================
    // LINE ITEMS
    // ============================================================

    /** Invoice line items (with item details and taxes) */
    private List<SalesInvoiceItemResponse> lineItems;

    /** Count of line items */
    private Integer itemCount;

    // ============================================================
    // STATUS & WORKFLOW
    // ============================================================

    /** Invoice status (DRAFT, PENDING_APPROVAL, APPROVED, POSTED, PARTIALLY_PAID, PAID, CANCELLED, REJECTED) */
    private InvoiceStatus status;

    /** GL posting status (PENDING, POSTED, REVERSED) */
    private PostingStatus glPostingStatus;

    /** GL journal entry ID (if posted) */
    private UUID glJournalEntryId;

    // ============================================================
    // APPROVAL WORKFLOW
    // ============================================================

    /** User ID of approver */
    private UUID approvedBy;

    /** Approver name (for display) */
    private String approverName;

    /** Timestamp of approval */
    private LocalDateTime approvedAt;

    /** Approval comment/notes (if any) */
    private String approvalNotes;

    // ============================================================
    // PAYMENT TRACKING
    // ============================================================

    /** Percentage of invoice paid (0-100) */
    private BigDecimal paymentPercentage;

    /** Last payment date (if any) */
    private LocalDate lastPaymentDate;

    // ============================================================
    // AUDIT INFORMATION
    // ============================================================

    /** Record creation timestamp */
    private LocalDateTime createdAt;

    /** Record last update timestamp */
    private LocalDateTime updatedAt;

    /** User ID who created the invoice */
    private UUID createdBy;

    /** User name who created the invoice */
    private String createdByName;

    /** User ID who last updated the invoice */
    private UUID updatedBy;

    /** User name who last updated the invoice */
    private String updatedByName;

    // ============================================================
    // RELATED ENTITIES SUMMARY
    // ============================================================

    /** Count of invoice taxes (for GST tracking) */
    private Integer taxTransactionCount;

    /** Count of partial payments received */
    private Integer paymentCount;

    /** Count of credit notes issued against this invoice */
    private Integer creditNoteCount;

    /** Amount available for credit note creation (derived from outstandingAmount) */
    private BigDecimal eligibleCreditAmount;

    // ============================================================
    // ADDITIONAL BUSINESS INFO
    // ============================================================

    /** Invoice is deleted (soft delete) */
    private Boolean isDeleted;

    /** Additional notes/remarks on invoice */
    private String remarks;

    /** Reference number (e.g., PO number, delivery note) */
    private String referenceNumber;

    /** Business purpose/description */
    private String businessDescription;

    // ============================================================
    // CALCULATED FIELDS FOR REPORTING
    // ============================================================

    /** Aging bucket (0-30, 31-60, 61-90, 90+) - calculated field */
    private String agingBucket;

    /** Days outstanding (calculated from today and due date) */
    private Integer daysOutstanding;

    /** Is invoice overdue (dueDate < today && outstanding > 0) */
    private Boolean isOverdue;

    /** Interest accrued on outstanding amount (if configured) */
    private BigDecimal interestAccrued;

}
