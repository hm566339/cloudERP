package com.erp.auth_service.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationSubscriptionResponse {
    private String planName;
    private String planCode;
    private String status;
    private Boolean trialPeriod;
    private LocalDateTime trialStartDate;
    private LocalDateTime trialEndDate;
    private LocalDateTime currentPeriodStart;
    private LocalDateTime currentPeriodEnd;
    private Integer companyLimit;
    private String storageLimit;
    private BigDecimal price;
    private String currency;
}

