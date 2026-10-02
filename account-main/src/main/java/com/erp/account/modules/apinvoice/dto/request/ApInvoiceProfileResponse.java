package com.erp.account.modules.apinvoice.dto.request;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import com.erp.account.enums.GstTreatment;
import com.erp.account.enums.ItcEligibility;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.PurchaseDocumentType;
import com.erp.account.enums.PurchaseNature;
import com.erp.account.enums.PurchaseSource;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApInvoiceProfileResponse extends BaseResponseDto  {
    // 1. Purchase Invoice Master
    private UUID id;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;

    private UUID placeOfSupplyStateId;
    private String placeOfSupplyStateCode;

    private UUID vendorAddressId;
    private String purchaseAddressLine1;
    private String purchaseAddressLine2;
    private String purchaseCity;
    private String purchaseState;
    private String purchaseCountry;
    private String purchasePostalCode;

    private String status;
    private String approvalStatus;
    private String paymentStatus;
    private String currency;
    private BigDecimal exchangeRate;
    private BigDecimal baseCurrencyAmount;
    private String referenceNumber;
    private String notes;
    private PurchaseSource purchaseSource;
    private PurchaseDocumentType documentType;
    private PurchaseNature purchaseNature;
    private PaymentType paymentType;
    private GstTreatment gstTreatment;
    private ItcEligibility itcEligibility;
    private String itcReason;
    private String supplierInvoiceNumber;
    private LocalDate supplierInvoiceDate;

    // 2-16 Nested Sections
    private PiCompanyInfoDto companyInformation;
    private PiVendorInfoDto vendorInformation;
    private List<PiItemDto> purchaseItems;
    private PiInventoryInfoDto inventoryInformation;
    private PiTaxSummaryDto taxSummary;
    private PiPaymentInfoDto paymentInformation;
    private PiVendorLedgerDto vendorLedger;
    private PiJournalEntryDto journalEntry;
    private PiLedgerImpactDto ledgerImpact;
    private PiRelatedDocumentsDto relatedDocuments;
    private PiApprovalWorkflowDto approvalWorkflow;
    private PiAttachmentsDto attachments;
    private PiAuditInfoDto auditInformation;
    private PiStatisticsDto statistics;
    private PiRelatedTransactionsDto relatedTransactions;
}
