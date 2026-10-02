package com.erp.account.modules.banktransaction.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Bank account ledger summary and transaction details response")
public class BankLedgerResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "Bank account unique identifier", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    private UUID bankAccountId;

    @Schema(description = "Bank name", example = "HDFC Bank")
    private String bankName;

    @Schema(description = "Bank account number", example = "XXXX7890")
    private String accountNumber;

    @Schema(description = "IFSC code", example = "HDFC0001234")
    private String ifscCode;

    @Schema(description = "Opening balance before transactions", example = "250000.00")
    private BigDecimal openingBalance;

    @Schema(description = "Sum of all debit transactions", example = "85000.00")
    private BigDecimal totalDebits;

    @Schema(description = "Sum of all credit transactions", example = "175000.00")
    private BigDecimal totalCredits;

    @Schema(description = "Closing balance after all transactions", example = "340000.00")
    private BigDecimal closingBalance;

    @Schema(description = "Total number of transactions", example = "6")
    private Long totalTransactions;

    @Schema(description = "Total number of reconciled transactions", example = "5")
    private Long reconciledTransactions;

    @Schema(description = "Total number of unreconciled transactions", example = "1")
    private Long unreconciledTransactions;

    @Schema(description = "List of ledger transaction entries for the current page")
    private List<BankLedgerEntryResponse> ledgerEntries;
}
