package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "module")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Module {

    /*
     * MODULE ID
     */
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    /*
     * MODULE DETAILS
     */
    @Column(length = 100, nullable = false, unique = true)
    private String name;

    @Column(name = "client_id", unique = true, nullable = false)
    private UUID clientId;

    @Column(name = "client_secret", nullable = false, length = 500)
    private String clientSecret;

    /*
     * MODULE HOST / DOMAIN
     * Example:
     * accounting.xyz.com
     */
    @Column(name = "host", length = 255)
    private String host;

    /*
     * MODULE STATUS
     */
    @Column(name = "module_status", nullable = false)
    private Boolean moduleStatus = true;

    /*
     * COMPANY MODULE MAPPING
     *
     * One module can be enabled
     * for multiple companies.
     */
    @OneToMany(
        mappedBy = "module",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<CompanyModule> companyModules;

    /*
     * SESSIONS
     */
    @OneToMany(mappedBy = "module")
    private List<Session> sessions;

    /*
     * TOKENS
     */
    @OneToMany(mappedBy = "module")
    private List<UserToken> userTokens;

    /*
     * AUTHORIZATION CODES
     */
    @OneToMany(mappedBy = "module")
    private List<AuthorizationCode> authorizationCodes;

    /*
     * AUDIT
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}