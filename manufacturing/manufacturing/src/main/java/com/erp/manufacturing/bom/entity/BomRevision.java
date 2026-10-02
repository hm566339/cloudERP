package com.erp.manufacturing.bom.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.BomRevisionStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "bom_revision")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BomRevision extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "bom_id", nullable = false) private Bom bom;
    @Column(name = "revision_number", nullable = false) private Integer revisionNumber;
    @Column(name = "revision_label") private String revisionLabel;
    @Column(name = "effective_from") private LocalDate effectiveFrom;
    @Column(name = "effective_to") private LocalDate effectiveTo;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private BomRevisionStatus status;
    @Column(name = "change_reason", columnDefinition = "text") private String changeReason;
    @Column(name = "approved_by") private UUID approvedBy;
    @Column(name = "approved_at") private LocalDateTime approvedAt;
}
