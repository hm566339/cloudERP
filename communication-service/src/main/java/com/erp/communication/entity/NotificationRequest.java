package com.erp.communication.entity;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.model.NotificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "notification_request")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "event_code", nullable = false, length = 100)
    private String eventCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 30)
    private CommunicationChannel channel;

    @Column(name = "recipient", nullable = false, length = 255)
    private String recipient;

    @Column(name = "recipient_masked", nullable = false, length = 255)
    private String recipientMasked;

    @Column(name = "subject", length = 500)
    private String subject;

    @Column(name = "idempotency_key", length = 255)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private NotificationStatus status;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private int retryCount = 0;

    @Column(name = "max_retries", nullable = false)
    @Builder.Default
    private int maxRetries = 3;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @Column(name = "error_summary", columnDefinition = "TEXT")
    private String errorSummary;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "notificationRequest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<NotificationDelivery> deliveries = new ArrayList<>();

    @PrePersist
    public void onPrePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
