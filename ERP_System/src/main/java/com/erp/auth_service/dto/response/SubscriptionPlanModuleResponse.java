package com.erp.auth_service.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanModuleResponse {
    private UUID id;
    private UUID moduleId;
    private String moduleName;
    private String host;
    private Boolean active;
    private LocalDateTime createdAt;
}
