package com.erp.crm.modules.quotation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_quotation_revision", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_quote_rev_quote_num", columnNames = {"quotation_id", "revision_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmQuotationRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "quotation_id", nullable = false)
    private UUID quotationId;

    @Column(name = "revision_number", nullable = false)
    private Integer revisionNumber;

    @Column(name = "revision_notes", columnDefinition = "text")
    private String revisionNotes;

    @Column(name = "snapshot_json", nullable = false, columnDefinition = "text")
    private String snapshotJson;

    @Column(name = "revised_by_user_id", nullable = false)
    private UUID revisedByUserId;

    @CreationTimestamp
    @Column(name = "revised_at", updatable = false)
    private LocalDateTime revisedAt;
}

