package com.erp.crm.modules.communication.dto;

import com.erp.crm.modules.communication.enums.CommunicationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {

    @NotBlank(message = "Entity type is required (e.g. LEAD, OPPORTUNITY, ACCOUNT)")
    private String entityType;

    @NotNull(message = "Entity ID is required")
    private UUID entityId;

    @NotNull(message = "Channel is required (WHATSAPP, EMAIL, SMS)")
    private CommunicationChannel channel;

    @NotBlank(message = "Recipient identifier (phone/email) is required")
    private String recipientIdentifier;

    private String subject;

    private String bodyText;

    private String templateCode;

    private Map<String, Object> templateParameters;
}

