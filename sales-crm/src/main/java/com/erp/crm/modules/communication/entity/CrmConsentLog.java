package com.erp.crm.modules.communication.entity;

import com.erp.crm.modules.communication.enums.CommunicationChannel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_consent_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmConsentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Enumerated(EnumType.STRING)
        @Column(name = "channel", nullable = false)
    private CommunicationChannel channel;

    @Column(name = "consent_action", nullable = false, length = 30)
    private String consentAction;

    @Column(name = "consent_source", nullable = false, length = 100)
    private String consentSource;

    @Column(name = "consent_text_snapshot", columnDefinition = "text")
    private String consentTextSnapshot;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @CreationTimestamp
    @Column(name = "captured_at", updatable = false)
    private LocalDateTime capturedAt;
}
