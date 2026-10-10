package com.erp.communication.dto.response;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.model.DeliveryStatus;
import com.erp.communication.model.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationStatusResponse {

    private UUID notificationId;
    private UUID companyId;
    private CommunicationChannel channel;
    private String recipientMasked;
    private String eventCode;
    private NotificationStatus status;
    private int retryCount;
    private int maxRetries;
    private String errorSummary;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<DeliveryAttemptResponse> deliveryAttempts = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliveryAttemptResponse {
        private UUID deliveryId;
        private String providerName;
        private int attemptNumber;
        private DeliveryStatus status;
        private String providerMessageId;
        private LocalDateTime attemptAt;
        private Long durationMs;
        private String errorDetails;
    }
}
