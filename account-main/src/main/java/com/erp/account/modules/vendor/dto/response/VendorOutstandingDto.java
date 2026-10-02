package com.erp.account.modules.vendor.dto.response;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorOutstandingDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private BigDecimal totalOutstanding;
    private BigDecimal overdueAmount;
    private BigDecimal notYetDueAmount;
    private Map<String, BigDecimal> ageingSummary;
}
