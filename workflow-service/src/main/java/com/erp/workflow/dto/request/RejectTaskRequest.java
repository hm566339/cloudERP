package com.erp.workflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RejectTaskRequest {

    @NotNull(message = "taskId is required")
    private UUID taskId;

    @NotBlank(message = "Reason/comments are required for rejection")
    private String comments;

    private Long version;
}
