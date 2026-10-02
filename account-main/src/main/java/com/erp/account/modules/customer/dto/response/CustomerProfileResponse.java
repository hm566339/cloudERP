package com.erp.account.modules.customer.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.util.List;
import java.util.Collections;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileResponse extends CustomerResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private CustomerLedgerInfoDto ledgerInformation;
    private CustomerOutstandingDto outstandingDetails;
    private List<CustomerInvoiceDto> salesInvoices = Collections.emptyList();
    private List<CustomerReceiptDto> receipts = Collections.emptyList();
    
    // Domain objects that might not be implemented yet can just be empty lists
    private List<Object> salesOrders = Collections.emptyList();
    private List<Object> deliveryNotes = Collections.emptyList();
    private List<Object> creditNotes = Collections.emptyList();
    private List<Object> debitNotes = Collections.emptyList();
    
    private List<CustomerContactDto> contacts = Collections.emptyList();
    private List<CustomerAddressResponse> addresses = Collections.emptyList();
    private List<CustomerTransactionDto> recentTransactions = Collections.emptyList();
    private List<CustomerLedgerEntryDto> ledgerEntries = Collections.emptyList();
    private CustomerStatisticsDto statistics;
    private CustomerAuditInfoDto auditInformation;
}
