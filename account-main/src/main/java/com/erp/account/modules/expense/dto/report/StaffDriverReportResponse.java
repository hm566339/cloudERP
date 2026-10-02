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
public class StaffDriverReportResponse {
    
    private UUID employeeId;
    
    private String employeeName;
    
    private String role;
    
    @Builder.Default
    private long voucherCount = 0;
    
    @Builder.Default
    private BigDecimal selfPaidReimbursable = BigDecimal.ZERO;
    
    @Builder.Default
    private BigDecimal companyPaid = BigDecimal.ZERO;
    
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;
}
