package com.erp.crm.modules.account.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_account_contact_relation", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_acc_contact_rel", columnNames = {"company_id", "account_id", "contact_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmAccountContactRelation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "contact_id", nullable = false)
    private UUID contactId;

    @Column(name = "relationship_title", length = 100)
    private String relationshipTitle;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

