package com.erp.workflow.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowAttachmentResponse {

    private UUID id;
    private UUID workflowTransactionId;
    private UUID workflowTaskId;
    private String fileName;
    private String fileUrl;
    private String contentType;
    private Long fileSize;
    private UUID uploadedBy;
    private String uploadedByName;
    private LocalDateTime createdAt;
}
