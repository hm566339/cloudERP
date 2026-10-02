package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "company_module",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {
                "company_id",
                "module_id"
            }
        )
    },
    indexes = {
        @Index(name = "idx_company_module_company", columnList = "company_id"),
        @Index(name = "idx_company_module_module", columnList = "module_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyModule {

    /*
     * ID
     */
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    /*
     * COMPANY
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    /*
     * MODULE
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    /*
     * MODULE ACCESS STATUS
     */
    @Column(nullable = false)
    private Boolean active = true;

    /*
     * USER ACCESS
     */
    @OneToMany(
        mappedBy = "companyModule",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<UserPortalAccess> userPortalAccesses;

    /*
     * AUDIT
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}