package com.erp.auth_service.model.platform;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "platform_audit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "platform_admin_id")
    private PlatformAdmin platformAdmin;

    @Column(name = "admin_email", length = 255)
    private String adminEmail;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "module_id")
    private UUID moduleId;

    @Column(name = "support_session_id")
    private UUID supportSessionId;

    @Column(name = "resource_type", length = 100)
    private String resourceType;

    @Column(name = "resource_id", length = 255)
    private String resourceId;

    @Column(length = 1000)
    private String reason;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(nullable = false, length = 50)
    private String result;

    @Column(columnDefinition = "TEXT")
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
