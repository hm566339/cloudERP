package com.erp.auth_service.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private Integer durationDays;
    private BigDecimal price;
    private String currency;
    private Boolean active;
    private Boolean isTrial;
    private Integer maxCompanies;
    private Integer maxUsersPerCompany;
    private Integer maxUsers;
    private List<SubscriptionPlanModuleResponse> modules;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
