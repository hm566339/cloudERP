package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.response.WorkflowAttachmentResponse;
import com.erp.workflow.exception.UnauthorizedWorkflowActionException;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.service.WorkflowAttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflow/attachments")
@RequiredArgsConstructor
@Tag(name = "Workflow Attachments", description = "Upload and download attachments associated with workflow instances and tasks")
public class WorkflowAttachmentController {

    private final WorkflowAttachmentService attachmentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload attachment file to a workflow transaction or task")
    public ResponseEntity<ApiResponse<WorkflowAttachmentResponse>> uploadAttachment(
            @RequestParam("transactionId") UUID transactionId,
            @RequestParam(value = "taskId", required = false) UUID taskId,
            @RequestParam("file") MultipartFile file) {
        UUID userId = SecurityUtils.getCurrentUserId().orElseThrow(() -> new UnauthorizedWorkflowActionException("User identity is required"));
        String username = SecurityUtils.getCurrentUsername();

        WorkflowAttachmentResponse response = attachmentService.uploadAttachment(transactionId, taskId, file, userId, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Attachment uploaded successfully"));
    }

    @GetMapping("/download/{attachmentId}")
    @Operation(summary = "Download attachment file by attachment ID")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID attachmentId) {
        Resource file = attachmentService.downloadAttachment(attachmentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }

    @GetMapping("/transaction/{transactionId}")
    @Operation(summary = "Get all attachments for a workflow transaction")
    public ResponseEntity<ApiResponse<List<WorkflowAttachmentResponse>>> getAttachmentsByTransaction(
            @PathVariable UUID transactionId) {
        List<WorkflowAttachmentResponse> list = attachmentService.getAttachmentsByTransaction(transactionId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete an attachment")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId().orElseThrow(() -> new UnauthorizedWorkflowActionException("User identity is required"));
        attachmentService.deleteAttachment(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Attachment deleted"));
    }
}
