package com.erp.crm.modules.communication.dto;

import com.erp.crm.modules.communication.enums.CommunicationChannel;
import com.erp.crm.modules.communication.enums.MessageDeliveryStatus;
import com.erp.crm.modules.communication.enums.MessageDirection;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {

    private UUID id;
    private UUID companyId;
    private UUID conversationId;
    private MessageDirection direction;
    private CommunicationChannel channel;
    private String senderIdentifier;
    private String recipientIdentifier;
    private String subject;
    private String bodyText;
    private MessageDeliveryStatus deliveryStatus;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime createdAt;
}

