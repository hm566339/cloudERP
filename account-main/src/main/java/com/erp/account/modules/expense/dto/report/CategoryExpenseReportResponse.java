package com.erp.account.modules.expense.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryExpenseReportResponse {
    
    private UUID categoryId;
    
    private String categoryName;
    
    @Builder.Default
    private long voucherCount = 0;
    
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;
    
    @Builder.Default
    private BigDecimal selfPaidAmount = BigDecimal.ZERO;
    
    @Builder.Default
    private BigDecimal companyPaidAmount = BigDecimal.ZERO;
}
