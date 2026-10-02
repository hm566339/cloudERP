package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_event", uniqueConstraints = @UniqueConstraint(name = "uk_payment_event_provider_id", columnNames = {"provider", "provider_event_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentEvent {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, length = 80)
    private String provider;

    @Column(name = "provider_event_id", nullable = false, length = 255)
    private String providerEventId;

    @Column(name = "event_type", nullable = false, length = 120)
    private String eventType;

    @Column(name = "signature_verified", nullable = false)
    private boolean signatureVerified;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "processing_status", nullable = false, length = 30)
    @Builder.Default
    private String processingStatus = "RECEIVED";

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}