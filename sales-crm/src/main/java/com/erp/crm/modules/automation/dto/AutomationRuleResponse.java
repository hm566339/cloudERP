package com.erp.crm.modules.automation.dto;

import com.erp.crm.modules.automation.enums.AutomationTrigger;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationRuleResponse {
    private UUID id;
    private UUID companyId;
    private String ruleName;
    private String ruleCode;
    private String description;
    private AutomationTrigger triggerEvent;
    private String entityType;
    private String filterConditionsJson;
    private Integer executionOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AutomationActionResponse> actions;
}

