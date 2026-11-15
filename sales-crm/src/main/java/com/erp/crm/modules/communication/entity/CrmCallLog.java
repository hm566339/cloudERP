package com.erp.crm.modules.communication.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.communication.enums.CallStatus;
import com.erp.crm.modules.communication.enums.MessageDirection;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_call_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmCallLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Enumerated(EnumType.STRING)
        @Column(name = "call_direction", nullable = false)
    @Builder.Default
    private MessageDirection callDirection = MessageDirection.OUTBOUND;

    @Builder.Default
    @Column(name = "provider_name", nullable = false, length = 50)
    private String providerName = "EXOTEL";

    @Column(name = "telephony_call_id", length = 255)
    private String telephonyCallId;

    @Column(name = "caller_number", nullable = false, length = 30)
    private String callerNumber;

    @Column(name = "recipient_number", nullable = false, length = 30)
    private String recipientNumber;

    @Column(name = "agent_user_id")
    private UUID agentUserId;

    @Enumerated(EnumType.STRING)
        @Column(name = "call_status", nullable = false)
    @Builder.Default
    private CallStatus callStatus = CallStatus.ANSWERED;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Builder.Default
    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds = 0;

    @Column(name = "recording_storage_url", length = 1000)
    private String recordingStorageUrl;

    @Column(name = "call_notes", columnDefinition = "text")
    private String callNotes;

    @Column(name = "sentiment", length = 30)
    private String sentiment;
}
