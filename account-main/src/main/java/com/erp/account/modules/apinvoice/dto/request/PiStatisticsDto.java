package com.erp.account.modules.apinvoice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiStatisticsDto {
    private Integer itemCount;
    private Integer paymentCount;
    private Integer debitNoteCount;
    private Integer creditNoteCount;
    private Integer daysOutstanding;
    private Integer daysOverdue;
}
