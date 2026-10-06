package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanRequest {

    @NotBlank(message = "Plan code is required")
    private String code;

    @NotBlank(message = "Plan name is required")
    private String name;

    private String description;

    @NotNull(message = "Duration in days is required")
    @Min(value = 1, message = "Duration must be at least 1 day")
    private Integer durationDays;

    private BigDecimal price;

    private String currency;

    private Boolean active;

    private Boolean isTrial;

    private Integer maxCompanies;

    private Integer maxUsersPerCompany;

    private Integer maxUsers;

    private List<UUID> moduleIds;
}
