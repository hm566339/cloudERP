package com.erp.workflow.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowCommentResponse {

    private UUID id;
    private UUID workflowTransactionId;
    private UUID workflowTaskId;
    private UUID userId;
    private String userName;
    private String commentText;
    private Boolean isInternal;
    private LocalDateTime createdAt;
}
