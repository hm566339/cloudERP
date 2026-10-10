package com.erp.communication.dto.request;

import com.erp.communication.channel.CommunicationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendChannelMessageRequest {

    @NotNull(message = "companyId is required")
    private UUID companyId;

    @NotNull(message = "channel is required")
    private CommunicationChannel channel;

    @NotBlank(message = "recipient is required")
    private String recipient;

    private String subject;

    private String templateCode;

    private String idempotencyKey;

    @Builder.Default
    private Map<String, Object> templateData = new HashMap<>();

    @Builder.Default
    private Boolean async = false;
}
