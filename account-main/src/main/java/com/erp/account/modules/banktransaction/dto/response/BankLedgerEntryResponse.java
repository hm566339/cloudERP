package com.erp.account.modules.banktransaction.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Bank ledger transaction entry")
public class BankLedgerEntryResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "Transaction unique identifier", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    private UUID transactionId;

    @Schema(description = "Transaction date", example = "2026-08-20")
    private LocalDate transactionDate;

    @Schema(description = "Reference number", example = "REF001")
    private String referenceNo;

    @Schema(description = "UTR number", example = "UTR123456")
    private String utrNo;

    @Schema(description = "Narration / description", example = "Vendor payment")
    private String narration;

    @Schema(description = "Debit amount (0.00 if credit)", example = "25000.00")
    private BigDecimal debitAmount;

    @Schema(description = "Credit amount (0.00 if debit)", example = "0.00")
    private BigDecimal creditAmount;

    @Schema(description = "Running balance after this transaction", example = "340000.00")
    private BigDecimal runningBalance;

    @Schema(description = "Reconciliation status", example = "true")
    private Boolean reconciled;

    @Schema(description = "Transaction type (DEBIT, CREDIT, etc.)", example = "DEBIT")
    private String transactionType;
}
