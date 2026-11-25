package com.erp.communication.chat.dto;

import com.erp.communication.chat.model.ChatActionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateActionStatusRequest {

    @NotNull(message = "actionStatus is required")
    private ChatActionStatus actionStatus;

    private String comment;
    private UUID referenceId;
    private Map<String, Object> metadata;
}
