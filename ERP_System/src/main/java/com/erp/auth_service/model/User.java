package com.erp.auth_service.model;

import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "\"user\"",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"company_id", "username"}),
        @UniqueConstraint(columnNames = {"company_id", "email"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    private String empId;

    /*
     * COMPANY (MULTI TENANT)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    /*
     * BASIC USER INFO
     */
    @Column(nullable = false, length = 100)
    private String username;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 255)
    private String fullName;

    /*
     * ACCOUNT STATUS
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus accountStatus = AccountStatus.INACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status emailStatus = Status.UNVERIFIED;

    /*
     * SECURITY
     */
    @Column(nullable = false)
    private Integer failedLoginCount = 0;

    private LocalDateTime lockedUntil;

    /*
     * AUDIT
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /*
     * RELATIONSHIPS
     */

    @OneToMany(
        mappedBy = "user",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<UserPortalAccess> portalAccesses;

    @OneToMany(
        mappedBy = "user",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<Session> sessions;

    @OneToMany(
        mappedBy = "user",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<AuthorizationCode> authorizationCodes;

    @OneToMany(
        mappedBy = "user",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<UserRole> userRoles;

    @OneToMany(
        mappedBy = "user",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private List<UserToken> tokens;

    /*
     * DEFAULT VALUES
     */
    @PrePersist
    public void prePersist() {

        if (accountStatus == null) {
            accountStatus = AccountStatus.INACTIVE;
        }

        if (emailStatus == null) {
            emailStatus = Status.UNVERIFIED;
        }

        if (failedLoginCount == null) {
            failedLoginCount = 0;
        }
    }
}