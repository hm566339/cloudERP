package com.erp.account.modules.apinvoice.dto.request;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiPaymentInfoDto extends BaseResponseDto  {
    private BigDecimal totalPaid;
    private BigDecimal outstandingAmount;
    private BigDecimal paymentPercentage;
    private LocalDate lastPaymentDate;
    private List<PiPaymentHistoryDto> paymentHistory;
    private String paymentReferences;
    private String paymentMode;
}
