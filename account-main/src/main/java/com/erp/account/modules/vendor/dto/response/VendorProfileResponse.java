package com.erp.account.modules.vendor.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import com.erp.account.modules.creditnote.dto.response.CreditNoteResponse;
import com.erp.account.modules.debitnote.dto.response.DebitNoteResponse;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptResponse;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderResponse;

import java.io.Serializable;
import java.util.List;
import java.util.Collections;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VendorProfileResponse extends VendorResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private VendorLedgerInfoDto ledgerInformation;
    private VendorOutstandingDto outstandingPayables;
    private List<VendorInvoiceDto> purchaseBills = Collections.emptyList();
    private List<VendorPaymentDto> paymentsMade = Collections.emptyList();
    
    // Domain objects that might not be implemented yet can just be empty lists
    private List<PurchaseOrderResponse> purchaseOrders = Collections.emptyList();
    private List<GoodsReceiptResponse> goodsReceiptNotes = Collections.emptyList();
    private List<DebitNoteResponse> debitNotes = Collections.emptyList();
    private List<CreditNoteResponse> creditNotes = Collections.emptyList();
    
    private List<VendorContactDto> contacts = Collections.emptyList();
    private List<VendorAddressDto> addresses = Collections.emptyList();
    private List<VendorTransactionDto> recentTransactions = Collections.emptyList();
    private List<VendorLedgerEntryDto> ledgerEntries = Collections.emptyList();
    private VendorStatisticsDto statistics;
    private VendorAuditInfoDto auditInformation;
}
