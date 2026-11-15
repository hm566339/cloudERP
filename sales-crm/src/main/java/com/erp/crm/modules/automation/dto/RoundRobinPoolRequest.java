package com.erp.crm.modules.automation.dto;

import com.erp.crm.modules.automation.enums.RoundRobinStrategy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoundRobinPoolRequest {

    @NotBlank(message = "Pool name is required")
    private String poolName;

    @NotBlank(message = "Pool code is required")
    private String poolCode;

    @NotNull(message = "Routing strategy is required")
    @Builder.Default
    private RoundRobinStrategy routingStrategy = RoundRobinStrategy.ROUND_ROBIN;

    @Builder.Default
    private Boolean isActive = true;

    private List<RoundRobinMemberDto> members;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoundRobinMemberDto {
        @NotNull(message = "User ID is required")
        private UUID userId;

        @Builder.Default
        private Integer weight = 1;

        @Builder.Default
        private Integer maxDailyLeads = 50;

        @Builder.Default
        private Boolean isActive = true;
    }
}

