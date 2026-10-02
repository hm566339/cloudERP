package com.erp.account.modules.receiptvoucher.dto.response.profile;

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
public class ReceiptVoucherProfileResponse extends BaseResponseDto  {
    // 1. Receipt Voucher Master
    private UUID id;
    private String receiptNo;
    private LocalDate receiptDate;
    private BigDecimal receiptAmount;
    private String paymentMode;
    private String referenceNo;
    private String transactionReference;
    private String remarks;
    private String receiptStatus;
    private String glPostingStatus;

    // Nested Sections
    private RvCompanyInfoDto companyInformation;
    private RvCustomerInfoDto customerInformation;
    private RvBankInfoDto bankAccountInformation;
    private RvReceiptInstrumentDto receiptInstrumentDetails;
    private List<RvAllocationDto> invoiceAllocations;
    private RvTaxInfoDto taxInformation;
    private RvJournalEntryDto generalLedgerPosting;
    private RvLedgerImpactDto ledgerImpact;
    private RvReconciliationDto receiptReconciliation;
    private RvApprovalWorkflowDto approvalWorkflow;
    private RvRelatedDocumentsDto relatedDocuments;
    private RvAttachmentsDto attachments;
    private RvStatisticsDto statistics;
    private RvAuditInfoDto auditInformation;
}
