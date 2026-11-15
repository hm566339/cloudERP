package com.erp.crm.modules.automation.dto;

import com.erp.crm.modules.automation.enums.RoundRobinStrategy;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoundRobinPoolResponse {
    private UUID id;
    private UUID companyId;
    private String poolName;
    private String poolCode;
    private RoundRobinStrategy routingStrategy;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RoundRobinMemberResponse> members;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoundRobinMemberResponse {
        private UUID id;
        private UUID poolId;
        private UUID userId;
        private Integer weight;
        private Integer maxDailyLeads;
        private Integer currentLeadsToday;
        private LocalDateTime lastAssignedAt;
        private Boolean isActive;
    }
}

