package com.erp.crm.modules.automation.dto;

import com.erp.crm.modules.automation.enums.AutomationTrigger;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationRuleRequest {

    @NotBlank(message = "Rule name is required")
    private String ruleName;

    @NotBlank(message = "Rule code is required")
    private String ruleCode;

    private String description;

    @NotNull(message = "Trigger event is required")
    private AutomationTrigger triggerEvent;

    @NotBlank(message = "Entity type is required (e.g. LEAD, OPPORTUNITY)")
    private String entityType;

    @NotBlank(message = "Filter conditions JSON or SpEL is required")
    private String filterConditionsJson;

    @Builder.Default
    private Integer executionOrder = 10;

    @Builder.Default
    private Boolean isActive = true;

    private List<AutomationActionDto> actions;
}

