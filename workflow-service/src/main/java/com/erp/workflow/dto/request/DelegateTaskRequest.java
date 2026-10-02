package com.erp.workflow.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DelegateTaskRequest {

    @NotNull(message = "taskId is required")
    private UUID taskId;

    @NotNull(message = "targetUserId is required")
    private UUID targetUserId;

    private String targetUserName;

    private String comments;

    private Long version;
}
