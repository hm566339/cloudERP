package com.erp.crm.modules.activity.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityResponse {

    private UUID id;
    private UUID companyId;
    private String entityType;
    private UUID entityId;
    private String activityType;
    private String subject;
    private String description;
    private LocalDateTime activityAt;
    private UUID performedByUserId;
    private LocalDateTime createdAt;
}

