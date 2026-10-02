package com.erp.manufacturing.bom.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "bom")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Bom extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @Column(name = "bom_number", nullable = false) private String bomNumber;
    @Column(name = "finished_product_id", nullable = false) private UUID finishedProductId;
    @Column(nullable = false) private String name;
    @Column(columnDefinition = "text") private String description;
    @Enumerated(EnumType.STRING) @Column(name = "bom_type", nullable = false) private BomType bomType;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private BomStatus status;
    @Column(name = "is_default", nullable = false) private Boolean isDefault;
    @Column(name = "effective_from") private LocalDate effectiveFrom;
    @Column(name = "effective_to") private LocalDate effectiveTo;
    @Column(name = "current_revision", nullable = false) private Integer currentRevision;
    @Column(name = "approved_by") private UUID approvedBy;
    @Column(name = "approved_at") private LocalDateTime approvedAt;
}
