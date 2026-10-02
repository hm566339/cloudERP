package com.erp.workflow.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApproveTaskRequest {

    @NotNull(message = "taskId is required")
    private UUID taskId;

    private String comments;

    private Long version; // Optimistic locking check

    private Map<String, Object> metadata;
}
