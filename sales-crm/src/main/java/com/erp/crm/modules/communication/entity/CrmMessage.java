package com.erp.crm.modules.communication.entity;

import com.erp.crm.modules.communication.enums.CommunicationChannel;
import com.erp.crm.modules.communication.enums.MessageDeliveryStatus;
import com.erp.crm.modules.communication.enums.MessageDirection;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false)
    private MessageDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    private CommunicationChannel channel;

    @Column(name = "sender_identifier", nullable = false, length = 255)
    private String senderIdentifier;

    @Column(name = "recipient_identifier", nullable = false, length = 255)
    private String recipientIdentifier;

    @Column(name = "subject", length = 500)
    private String subject;

    @Column(name = "body_text", nullable = false, columnDefinition = "text")
    private String bodyText;

    @Column(name = "body_html", columnDefinition = "text")
    private String bodyHtml;

    @Column(name = "media_storage_url", length = 1000)
    private String mediaStorageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", nullable = false)
    @Builder.Default
    private MessageDeliveryStatus deliveryStatus = MessageDeliveryStatus.QUEUED;

    @Column(name = "external_message_id", length = 255)
    private String externalMessageId;

    @Column(name = "error_code", length = 100)
    private String errorCode;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "notification_request_id")
    private UUID notificationRequestId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
