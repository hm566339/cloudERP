package com.erp.crm.modules.activity.entity;

import com.erp.crm.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_activity")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmActivity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "activity_type", nullable = false, length = 50)
    private String activityType;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Builder.Default
    @Column(name = "activity_at", nullable = false)
    private LocalDateTime activityAt = LocalDateTime.now();

    @Column(name = "performed_by_user_id", nullable = false)
    private UUID performedByUserId;
}

