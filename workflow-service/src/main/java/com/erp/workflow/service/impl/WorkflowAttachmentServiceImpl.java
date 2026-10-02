package com.erp.workflow.service.impl;

import com.erp.workflow.dto.response.WorkflowAttachmentResponse;
import com.erp.workflow.entity.WorkflowAttachment;
import com.erp.workflow.entity.WorkflowTask;
import com.erp.workflow.entity.WorkflowTransaction;
import com.erp.workflow.exception.ResourceNotFoundException;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.repository.WorkflowAttachmentRepository;
import com.erp.workflow.repository.WorkflowTaskRepository;
import com.erp.workflow.repository.WorkflowTransactionRepository;
import com.erp.workflow.service.WorkflowAttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowAttachmentServiceImpl implements WorkflowAttachmentService {

    private final WorkflowAttachmentRepository attachmentRepository;
    private final WorkflowTransactionRepository transactionRepository;
    private final WorkflowTaskRepository taskRepository;

    @Value("${workflow.attachment.storage-path:uploads/workflow}")
    private String storagePath;

    @Override
    @Transactional
    public WorkflowAttachmentResponse uploadAttachment(UUID transactionId, UUID taskId, MultipartFile file, UUID userId, String userName) {
        if (file.isEmpty()) {
            throw new WorkflowValidationException("Cannot upload empty file");
        }

        WorkflowTransaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTransaction", "id", transactionId));

        WorkflowTask task = null;
        if (taskId != null) {
            task = taskRepository.findById(taskId).orElse(null);
        }

        try {
            Path uploadDir = Paths.get(storagePath).toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment.bin";
            String extension = "";
            int extIdx = originalName.lastIndexOf(".");
            if (extIdx > 0) {
                extension = originalName.substring(extIdx);
            }

            String storedFileName = UUID.randomUUID() + extension;
            Path targetLocation = uploadDir.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/v1/workflow/attachments/download/" + storedFileName;

            WorkflowAttachment attachment = WorkflowAttachment.builder()
                    .workflowTransaction(txn)
                    .workflowTask(task)
                    .fileName(originalName)
                    .storedFileName(storedFileName)
                    .fileUrl(fileUrl)
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .fileSize(file.getSize())
                    .uploadedBy(userId)
                    .uploadedByName(userName)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .build();

            attachment = attachmentRepository.save(attachment);

            return mapToResponse(attachment);
        } catch (IOException ex) {
            log.error("Failed to store file", ex);
            throw new WorkflowValidationException("Failed to store file: " + ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadAttachment(UUID attachmentId) {
        WorkflowAttachment attachment = attachmentRepository.findById(attachmentId)
                .filter(a -> !a.getIsDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowAttachment", "id", attachmentId));

        try {
            Path filePath = Paths.get(storagePath).toAbsolutePath().normalize().resolve(attachment.getStoredFileName());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File on disk", "name", attachment.getStoredFileName());
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File on disk", "url", attachment.getStoredFileName());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowAttachmentResponse> getAttachmentsByTransaction(UUID transactionId) {
        return attachmentRepository.findByWorkflowTransactionIdAndIsDeletedFalseOrderByCreatedAtAsc(transactionId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAttachment(UUID attachmentId, UUID userId) {
        WorkflowAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowAttachment", "id", attachmentId));

        attachment.setIsDeleted(true);
        attachment.setUpdatedAt(LocalDateTime.now());
        attachmentRepository.save(attachment);
    }

    private WorkflowAttachmentResponse mapToResponse(WorkflowAttachment entity) {
        return WorkflowAttachmentResponse.builder()
                .id(entity.getId())
                .workflowTransactionId(entity.getWorkflowTransaction().getId())
                .workflowTaskId(entity.getWorkflowTask() != null ? entity.getWorkflowTask().getId() : null)
                .fileName(entity.getFileName())
                .fileUrl(entity.getFileUrl())
                .contentType(entity.getContentType())
                .fileSize(entity.getFileSize())
                .uploadedBy(entity.getUploadedBy())
                .uploadedByName(entity.getUploadedByName())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
