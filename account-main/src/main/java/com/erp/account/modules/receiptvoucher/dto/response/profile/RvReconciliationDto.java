package com.erp.account.modules.receiptvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RvReconciliationDto {
    private String reconciliationStatus;
    private LocalDate bankReconciliationDate;
    private BigDecimal clearedAmount;
    private BigDecimal unclearedAmount;
    private String reconciliationRemarks;
}
