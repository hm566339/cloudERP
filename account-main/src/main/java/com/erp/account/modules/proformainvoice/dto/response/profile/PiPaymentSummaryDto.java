package com.erp.account.modules.proformainvoice.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiPaymentSummaryDto {
    private Boolean advanceRequired;
    private BigDecimal advanceAmount;
    private BigDecimal receivedAmount;
    private BigDecimal remainingAdvance;
    private String paymentStatus;
    private List<PiReceiptDto> receipts;
}
