package com.erp.account.modules.bankaccount.dto.response.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountProfileResponse extends BaseResponseDto  {
    
    // 1. Bank Account Master
    private BankAccountMasterDto bankAccountMaster;
    
    // 2. Company Information
    private CompanyProfileDto companyInformation;
    
    // 3. Linked GL Account
    private LinkedGlAccountDto linkedGlAccount;
    
    // 4. Linked Ledger Account
    private LinkedLedgerAccountDto linkedLedgerAccount;
    
    // 5. Balance Summary
    private BalanceSummaryDto balanceSummary;
    
    // 6. Bank Transactions
    private List<BankTransactionProfileDto> bankTransactions;
    
    // 7. Payment Vouchers
    private List<PaymentVoucherProfileSnippetDto> paymentVouchers;
    
    // 8. Receipt Vouchers
    private List<ReceiptVoucherProfileSnippetDto> receiptVouchers;
    
    // 9. Bank Reconciliation
    private BankReconciliationSnippetDto bankReconciliation;
    
    // 10. General Ledger Posting
    private List<GlPostingSnippetDto> generalLedgerPostings;
    
    // 11. Statistics
    private BankStatisticsDto statistics;
    
    // 12. Related Documents
    private RelatedDocumentsDto relatedDocuments;
    
    // 13. Attachments
    // Reusing AttachmentDto from PaymentVoucher
    private List<com.erp.account.modules.paymentvoucher.dto.response.profile.AttachmentDto> attachments;
    
    // 14. Audit Information
    private AuditInfoDto auditInformation;
}
