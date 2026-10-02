package com.erp.account.modules.paymentvoucher.dto.response.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
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
public class PaymentVoucherProfileResponse extends BaseResponseDto  {
    
    // 1. Payment Voucher Master
    private UUID voucherId;
    private String voucherNo;
    private LocalDate voucherDate;
    private BigDecimal paymentAmount;
    private PaymentMode paymentMode;
    private String referenceNo;
    private String transactionReference;
    private String remarks;
    private PaymentStatus status;
    private PostingStatus glPostingStatus;

    // 2. Company Information
    private CompanyProfileDto companyInformation;

    // 3. Vendor Information
    private VendorProfileDto vendorInformation;

    // 4. Bank / Cash Account Information
    private BankProfileDto bankAccountInformation;

    // 5. Payment Instrument Details
    private PaymentInstrumentDto paymentInstrumentDetails;

    // 6. Invoice Allocations
    private List<InvoiceAllocationProfileDto> invoiceAllocations;

    // 7. Tax Information
    private TaxInfoDto taxInformation;

    // 8. General Ledger Posting
    private GlPostingDto generalLedgerPosting;

    // 9. Ledger Impact
    private LedgerImpactDto ledgerImpact;

    // 10. Payment Reconciliation
    private PaymentReconciliationDto paymentReconciliation;

    // 11. Approval Workflow
    private ApprovalWorkflowDto approvalWorkflow;

    // 12. Related Documents
    private RelatedDocumentsDto relatedDocuments;

    // 13. Attachments
    private List<AttachmentDto> attachments;

    // 14. Statistics
    private StatisticsDto statistics;

    // 15. Audit Information
    private AuditInfoDto auditInformation;
}
