package com.erp.crm.modules.activity.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.activity.enums.TaskPriority;
import com.erp.crm.modules.activity.enums.TaskStatus;
import com.erp.crm.modules.activity.enums.TaskType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "crm_task")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmTask extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Enumerated(EnumType.STRING)
        @Column(name = "task_type", nullable = false)
    @Builder.Default
    private TaskType taskType = TaskType.FOLLOW_UP;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
        @Column(name = "priority", nullable = false)
    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
        @Column(name = "status", nullable = false)
    @Builder.Default
    private TaskStatus status = TaskStatus.PENDING;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "due_time")
    private LocalTime dueTime;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "assigned_to_user_id", nullable = false)
    private UUID assignedToUserId;

    @Column(name = "created_by_user_id", nullable = false)
    private UUID createdByUserId;

    @Column(name = "reminder_at")
    private LocalDateTime reminderAt;

    @Builder.Default
    @Column(name = "reminder_sent", nullable = false)
    private Boolean reminderSent = false;

    @Builder.Default
    @Column(name = "is_recurring", nullable = false)
    private Boolean isRecurring = false;

    @Column(name = "recurrence_pattern", length = 50)
    private String recurrencePattern;

    @Column(name = "calendar_event_id", length = 255)
    private String calendarEventId;
}
