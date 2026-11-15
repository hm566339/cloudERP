package com.erp.crm.modules.communication.dto;

import com.erp.crm.modules.communication.enums.CallStatus;
import com.erp.crm.modules.communication.enums.MessageDirection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallLogRequest {

    private String entityType;
    private UUID entityId;

    @Builder.Default
    private MessageDirection callDirection = MessageDirection.OUTBOUND;

    @Builder.Default
    private String providerName = "EXOTEL";

    private String telephonyCallId;

    @NotBlank(message = "Caller number is required")
    private String callerNumber;

    @NotBlank(message = "Recipient number is required")
    private String recipientNumber;

    private UUID agentUserId;

    @Builder.Default
    private CallStatus callStatus = CallStatus.ANSWERED;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer durationSeconds;

    private String recordingStorageUrl;

    private String callNotes;
}

