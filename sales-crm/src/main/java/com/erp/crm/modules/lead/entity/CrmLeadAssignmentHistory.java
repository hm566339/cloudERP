package com.erp.crm.modules.lead.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_lead_assignment_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLeadAssignmentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Column(name = "from_user_id")
    private UUID fromUserId;

    @Column(name = "to_user_id", nullable = false)
    private UUID toUserId;

    @Column(name = "assigned_by_user_id")
    private UUID assignedByUserId;

    @Builder.Default
    @Column(name = "assignment_method", nullable = false, length = 50)
    private String assignmentMethod = "MANUAL";

    @Column(name = "reason", columnDefinition = "text")
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

