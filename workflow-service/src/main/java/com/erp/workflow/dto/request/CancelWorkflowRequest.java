package com.erp.workflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelWorkflowRequest {

    @NotBlank(message = "Cancellation reason is required")
    private String reason;
}
