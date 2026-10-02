package com.erp.account.modules.quotation.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

import com.erp.account.modules.quotation.entity.QuotationStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationFilterDto {
    private String searchKey;
    private String quotationNumber;
    private UUID customerId;
    private QuotationStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
}
