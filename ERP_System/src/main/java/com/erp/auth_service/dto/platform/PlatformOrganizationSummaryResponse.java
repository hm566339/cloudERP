package com.erp.auth_service.dto.platform;

import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.OrganizationStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformOrganizationSummaryResponse {

    private UUID id;
    private String name;
    private String code;
    private OrganizationStatus status;
    private AccessMode accessMode;
    private String planName;
    private SubscriptionStatus subscriptionStatus;
    private LocalDateTime trialEndsAt;
    private long userCount;
    private long companyCount;
    private LocalDateTime createdAt;
}
