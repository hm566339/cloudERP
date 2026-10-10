package com.erp.communication.dto.response;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.model.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunicationResponse {

    private UUID notificationId;
    private UUID companyId;
    private CommunicationChannel channel;
    private String recipientMasked;
    private NotificationStatus status;
    private String idempotencyKey;
    private String providerName;
    private String providerMessageId;
    private LocalDateTime createdAt;
    private String message;
}
