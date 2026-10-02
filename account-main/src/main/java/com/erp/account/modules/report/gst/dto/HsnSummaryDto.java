package com.erp.account.modules.report.gst.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class HsnSummaryDto {
    private String hsnCode;
    private String description;
    private String uqc;
    private BigDecimal quantity = BigDecimal.ZERO;
    private BigDecimal taxableValue = BigDecimal.ZERO;
    private BigDecimal cgst = BigDecimal.ZERO;
    private BigDecimal sgst = BigDecimal.ZERO;
    private BigDecimal igst = BigDecimal.ZERO;
    private BigDecimal cess = BigDecimal.ZERO;
}
