package com.erp.auth_service.model;

import com.erp.auth_service.utility.TokenType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "user_token")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserToken {

    /*
     * TOKEN ID
     */
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    /*
     * TOKEN VALUE
     */
    @Column(unique = true, nullable = false, length = 500)
    private String token;

    /*
     * TOKEN TYPE
     * Example:
     * EMAIL_VERIFICATION
     * PASSWORD_RESET
     * MFA
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TokenType tokenType;

    /*
     * USER
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /*
     * COMPANY (MULTI TENANT)
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
     * TOKEN STATUS
     */
    @Column(nullable = false)
    private Boolean used = false;

    /*
     * EXPIRY
     */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /*
     * AUDIT
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}