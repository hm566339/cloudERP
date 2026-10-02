package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "session")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    /*
     * SESSION ID
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
     * COMPANY (MULTI TENANT)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    /*
     * MODULE
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private Module module;

    /*
     * ACCESS TOKEN
     */
    @Column(unique = true, nullable = false, columnDefinition = "TEXT")
    private String accessToken;

    @Column(nullable = false)
    private LocalDateTime accessTokenValidTill;

    /*
     * REFRESH TOKEN
     */
    @Column(unique = true, columnDefinition = "TEXT")
    private String refreshToken;

    @Column(nullable = false)
    private LocalDateTime refreshTokenValidTill;

    /*
     * CLIENT INFO
     */
    @Column(length = 100)
    private String ipAddress;

    @Column(columnDefinition = "TEXT")
    private String userAgent;

    /*
     * AUDIT
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}