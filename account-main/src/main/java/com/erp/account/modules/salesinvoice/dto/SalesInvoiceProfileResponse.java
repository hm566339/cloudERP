package com.erp.account.modules.salesinvoice.dto;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesInvoiceProfileResponse extends BaseResponseDto  {
    // 1. Master Fields
    private UUID id;
    private String invoiceNumber;
    private UUID salesOrderId;
    private String salesOrderNumber;
    private UUID deliveryChallanId;
    private String deliveryChallanNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private String status;
    private String paymentStatus;
    private String currency;
    private BigDecimal exchangeRate;
    private BigDecimal baseCurrencyAmount;
    
    private UUID placeOfSupplyStateId;
    private String placeOfSupplyStateCode;
    
    private String placeOfSupply;
    private String referenceNumber;
    private String businessDescription;
    private String remarks;

    private UUID paymentTermId;
    private String paymentTerms;
    private UUID termsConditionId;
    private String termsAndConditions;
    private String deliveryTerms;

    // 2-18 Nested Sections
    private SiCompanyInfoDto companyInformation;
    private SiCustomerInfoDto customerInformation;
    private List<SiLineItemDto> lineItems;
    private SiInventoryInfoDto inventoryInformation;
    private SiTaxSummaryDto taxSummary;
    private SiPaymentInfoDto paymentInformation;
    private List<SiCreditNoteDto> creditNotes;
    private List<SiDebitNoteDto> debitNotes;
    private SiJournalEntryDto journalEntry;
    private SiLedgerImpactDto ledgerImpact;
    private SiDeliveryInfoDto deliveryInformation;
    private SiApprovalWorkflowDto approvalWorkflow;
    private SiAttachmentsDto attachments;
    private SiEinvoiceEwayBillDto eInvoiceAndEWayBill;
    private SiAuditInfoDto auditInformation;
    private SiStatisticsDto statistics;
    private SiRelatedTransactionsDto relatedTransactions;
}
