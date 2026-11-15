package com.erp.crm.modules.automation.dto;

import com.erp.crm.modules.automation.enums.AutomationActionType;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationActionResponse {
    private UUID id;
    private UUID ruleId;
    private Integer actionOrder;
    private AutomationActionType actionType;
    private String actionPayloadJson;
    private Integer delayMinutes;
}

