package com.erp.auth_service.dto.response;

import com.erp.auth_service.utility.CompanySubscriptionStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanySubscriptionResponse {
    private UUID id;
    private UUID companyId;
    private String companyName;
    private String companyCode;
    private UUID planId;
    private String planName;
    private String planCode;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private CompanySubscriptionStatus status;
    private Boolean autoRenew;
    private Boolean isExpired;
    private List<String> provisionedModules;
    private LocalDateTime createdAt;
}
