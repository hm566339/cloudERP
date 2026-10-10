package com.erp.communication.entity;

import com.erp.communication.model.DeliveryStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_delivery")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDelivery {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_id", nullable = false)
    private NotificationRequest notificationRequest;

    @Column(name = "provider_name", nullable = false, length = 100)
    private String providerName;

    @Column(name = "attempt_number", nullable = false)
    private int attemptNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private DeliveryStatus status;

    @Column(name = "provider_message_id", length = 255)
    private String providerMessageId;

    @Column(name = "attempt_at", nullable = false)
    private LocalDateTime attemptAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "error_details", columnDefinition = "TEXT")
    private String errorDetails;

    @PrePersist
    public void onPrePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.attemptAt == null) {
            this.attemptAt = LocalDateTime.now();
        }
    }
}
