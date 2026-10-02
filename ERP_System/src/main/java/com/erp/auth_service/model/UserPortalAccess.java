package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "user_portal_access",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {
                "user_id",
                "company_module_id"
            }
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPortalAccess {

    /*
     * ID
     */
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    /*
     * USER
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /*
     * COMPANY MODULE
     *
     * This ensures:
     * - module belongs to company
     * - user accesses only allowed company modules
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_module_id", nullable = false)
    private CompanyModule companyModule;

    /*
     * ACCESS STATUS
     */
    @Column(nullable = false)
    private boolean status = true;

    /*
     * AUDIT
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}