package com.erp.crm.modules.activity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityRequest {

    @NotBlank(message = "Entity type is required (e.g. LEAD, OPPORTUNITY, ACCOUNT)")
    private String entityType;

    @NotNull(message = "Entity ID is required")
    private UUID entityId;

    @NotBlank(message = "Activity type is required (e.g. CALL, EMAIL, MEETING, NOTE)")
    private String activityType;

    @NotBlank(message = "Subject is required")
    private String subject;

    private String description;

    private LocalDateTime activityAt;
}

