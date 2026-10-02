package com.erp.auth_service.model;

import com.erp.auth_service.utility.UserRoleId;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "user_role")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(UserRoleId.class)
public class UserRole {

    /*
     * USER
     */
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /*
     * ROLE
     */
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /*
     * ASSIGNED AT
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime assignedAt;

    /*
     * AUDIT
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /*
     * HELPER METHODS
     */
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }

    public UUID getRoleId() {
        return role != null ? role.getId() : null;
    }
}