package com.erp.crm.modules.integration.dto;

import lombok.*;

import java.util.List;
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
    private List<UUID> leadIds;
    private Integer leadsCount;
    private String provider;
    private String message;
}

