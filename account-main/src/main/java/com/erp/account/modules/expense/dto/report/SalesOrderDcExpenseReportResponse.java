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
public class SalesOrderDcExpenseReportResponse {
    
    private UUID salesOrderId;
    
    private String salesOrderNo;
    
    private UUID deliveryChallanId;
    
    private String deliveryChallanNo;
    
    private UUID employeeId;
    
    private String employeeName;
    
    private UUID vehicleId;
    
    private String vehicleNumber;
    
    @Builder.Default
    private long voucherCount = 0;
    
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;
}
