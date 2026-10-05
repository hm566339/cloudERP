package com.erp.auth_service.dto.subscription;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpaySubscriptionDto {
    private String id;
    private String planId;
    private String status;
    private String customerId;
    private Long currentStart;
    private Long currentEnd;
    private Long chargeAt;
    private Long endedAt;
    private Integer totalCount;
    private Integer paidCount;
    private Integer remainingCount;
    private Map<String, String> notes;
}
