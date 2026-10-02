package com.erp.account.modules.gstslab.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GstStatisticsDto extends BaseResponseDto  {
    private Integer totalLinkedProducts;
    private Integer totalSalesInvoices;
    private Integer totalPurchaseBills;
    private BigDecimal totalTaxCollected;
    private BigDecimal totalTaxPaid;
    private BigDecimal netGstLiability;
}
