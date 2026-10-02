package com.erp.workflow.service;

import com.erp.workflow.dto.response.WorkflowAttachmentResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface WorkflowAttachmentService {

    WorkflowAttachmentResponse uploadAttachment(UUID transactionId, UUID taskId, MultipartFile file, UUID userId, String userName);

    Resource downloadAttachment(UUID attachmentId);

    List<WorkflowAttachmentResponse> getAttachmentsByTransaction(UUID transactionId);

    void deleteAttachment(UUID attachmentId, UUID userId);
}
