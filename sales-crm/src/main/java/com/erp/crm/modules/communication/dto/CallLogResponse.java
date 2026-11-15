package com.erp.crm.modules.communication.dto;

import com.erp.crm.modules.communication.enums.CallStatus;
import com.erp.crm.modules.communication.enums.MessageDirection;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallLogResponse {

    private UUID id;
    private UUID companyId;
    private String entityType;
    private UUID entityId;
    private MessageDirection callDirection;
    private String providerName;
    private String callerNumber;
    private String recipientNumber;
    private UUID agentUserId;
    private CallStatus callStatus;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationSeconds;
    private String recordingStorageUrl;
    private String callNotes;
    private LocalDateTime createdAt;
}

