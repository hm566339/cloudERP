package com.erp.crm.modules.automation.dto;

import com.erp.crm.modules.automation.enums.AutomationActionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationActionDto {
    private Integer actionOrder;

    @NotNull(message = "Action type is required")
    private AutomationActionType actionType;

    @NotBlank(message = "Action payload JSON is required")
    private String actionPayloadJson;

    private Integer delayMinutes;
}

