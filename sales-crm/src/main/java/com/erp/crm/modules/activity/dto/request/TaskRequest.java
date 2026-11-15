package com.erp.crm.modules.activity.dto.request;

import com.erp.crm.modules.activity.enums.TaskPriority;
import com.erp.crm.modules.activity.enums.TaskType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class TaskRequest {

    @NotBlank(message = "Entity type is required")
    private String entityType;

    @NotNull(message = "Entity ID is required")
    private UUID entityId;

    @Builder.Default
    private TaskType taskType = TaskType.FOLLOW_UP;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private LocalTime dueTime;

    private UUID assignedToUserId;

    private LocalDateTime reminderAt;
}

