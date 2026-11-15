package com.erp.crm.modules.activity.dto.response;

import com.erp.crm.modules.activity.enums.TaskPriority;
import com.erp.crm.modules.activity.enums.TaskStatus;
import com.erp.crm.modules.activity.enums.TaskType;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {

    private UUID id;
    private UUID companyId;
    private String entityType;
    private UUID entityId;
    private TaskType taskType;
    private String title;
    private String description;
    private TaskPriority priority;
    private TaskStatus status;
    private LocalDate dueDate;
    private LocalTime dueTime;
    private LocalDateTime completedAt;
    private UUID assignedToUserId;
    private UUID createdByUserId;
    private LocalDateTime reminderAt;
    private Boolean reminderSent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

