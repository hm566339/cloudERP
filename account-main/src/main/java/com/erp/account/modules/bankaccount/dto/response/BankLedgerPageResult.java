package com.erp.account.modules.bankaccount.dto.response;

import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Wrapper to carry both ledger data and pagination metadata
 * from the service layer to the controller.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankLedgerPageResult {

    private BankLedgerResponse ledgerResponse;
    private PaginationResponse pagination;
}
