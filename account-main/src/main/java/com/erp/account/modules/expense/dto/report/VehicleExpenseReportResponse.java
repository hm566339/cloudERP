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
public class VehicleExpenseReportResponse {
    
    private UUID vehicleId;
    
    private String vehicleNumber;
    
    @Builder.Default
    private long voucherCount = 0;
    
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;
    
    @Builder.Default
    private BigDecimal fuelAmount = BigDecimal.ZERO;
    
    @Builder.Default
    private BigDecimal maintenanceAmount = BigDecimal.ZERO;
}
