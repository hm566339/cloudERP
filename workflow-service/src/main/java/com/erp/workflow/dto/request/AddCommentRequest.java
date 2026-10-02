package com.erp.workflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddCommentRequest {

    private UUID taskId;

    @NotBlank(message = "Comment text is required")
    private String commentText;

    private Boolean isInternal = false;
}
