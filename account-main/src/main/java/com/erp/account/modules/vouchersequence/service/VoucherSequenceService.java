package com.erp.account.modules.vouchersequence.service;

import java.time.LocalDate;
import java.util.UUID;

public interface VoucherSequenceService {
    String generateNextReceiptNumber(UUID companyId, LocalDate receiptDate);

    String generateNextCreditNoteNumber(UUID companyId, String companyCode, LocalDate noteDate);
    String generateNextDebitNoteNumber(UUID companyId, String companyCode, LocalDate noteDate);
    
    String generateNextQuotationNumber(UUID companyId, LocalDate quotationDate);
    
    String generateNextProformaInvoiceNumber(UUID companyId, LocalDate piDate);
    
    String generateNextSalesOrderNumber(UUID companyId, LocalDate soDate);
    
    String generateNextDeliveryChallanNumber(UUID companyId, LocalDate dcDate);
    
    String generateNextExpenseRequestNumber(UUID companyId, LocalDate requestDate);

    String generateNextExpenseClaimNumber(UUID companyId, LocalDate claimDate);
    
    String generateNextReimbursementNumber(UUID companyId, LocalDate reimbursementDate);

    String generateNextPurchaseOrderNumber(UUID companyId, LocalDate poDate);

    String generateNextPurchaseRequisitionNumber(UUID companyId, LocalDate requisitionDate);

    String generateNextRfqNumber(UUID companyId, LocalDate rfqDate);

    String generateNextSupplierQuotationNumber(UUID companyId, LocalDate quotationDate);

    String generateNextGrnNumber(UUID companyId, LocalDate grnDate);

    String generateNextPurchaseReturnNumber(UUID companyId, LocalDate returnDate);
}
