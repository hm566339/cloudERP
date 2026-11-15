package com.erp.crm.modules.integration.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookAckResponse {

    private String status;
    private String idempotencyHash;
    private String processingStatus;
    private UUID leadId;
}

