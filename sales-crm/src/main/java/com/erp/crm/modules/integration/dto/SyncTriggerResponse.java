package com.erp.crm.modules.integration.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncTriggerResponse {
    private UUID integrationId;
    private String syncStatus;
    private Integer queuedRecords;
    private String message;
}

