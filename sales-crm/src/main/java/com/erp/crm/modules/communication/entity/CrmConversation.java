package com.erp.crm.modules.communication.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.communication.enums.CommunicationChannel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_conversation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmConversation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
        @Column(name = "channel", nullable = false)
    @Builder.Default
    private CommunicationChannel channel = CommunicationChannel.WHATSAPP;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "customer_identifier", nullable = false, length = 255)
    private String customerIdentifier;

    @Column(name = "external_thread_id", length = 255)
    private String externalThreadId;

    @Column(name = "subject", length = 255)
    private String subject;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "OPEN";

    @Column(name = "assigned_agent_id")
    private UUID assignedAgentId;

    @Builder.Default
    @Column(name = "unread_count", nullable = false)
    private Integer unreadCount = 0;

    @Builder.Default
    @Column(name = "last_message_at", nullable = false)
    private LocalDateTime lastMessageAt = LocalDateTime.now();
}
