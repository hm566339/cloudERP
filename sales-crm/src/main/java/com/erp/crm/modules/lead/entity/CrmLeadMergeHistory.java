package com.erp.crm.modules.lead.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_lead_merge_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLeadMergeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "primary_lead_id", nullable = false)
    private UUID primaryLeadId;

    @Column(name = "merged_lead_id", nullable = false)
    private UUID mergedLeadId;

    @Column(name = "merged_lead_snapshot_json", nullable = false, columnDefinition = "text")
    private String mergedLeadSnapshotJson;

    @Column(name = "merged_by_user_id", nullable = false)
    private UUID mergedByUserId;

    @Column(name = "merge_reason", columnDefinition = "text")
    private String mergeReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

