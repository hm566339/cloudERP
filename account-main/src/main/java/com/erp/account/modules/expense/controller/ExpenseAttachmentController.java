package com.erp.account.modules.expense.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.expense.dto.ExpenseAttachmentUploadResponse;
import com.erp.account.modules.expense.service.ExpenseAttachmentStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/account/v1/expenses/attachments")
@RequiredArgsConstructor
@Tag(name = "Expense Attachments", description = "Endpoints for uploading and viewing expense bill attachments (JPG, JPEG, PNG, PDF)")
public class ExpenseAttachmentController {

    private final ExpenseAttachmentStorageService expenseAttachmentStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload Expense Bill Attachment", description = "Uploads a bill/invoice file (JPG, JPEG, PNG, PDF) up to 10MB and returns secure file URL")
    public ResponseEntity<ApiResponse<ExpenseAttachmentUploadResponse>> uploadAttachment(
            @Parameter(description = "Bill attachment file (JPG, JPEG, PNG, PDF)", required = true)
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) UUID companyId) {

        log.info("POST /api/account/v1/expenses/attachments - Uploading bill attachment: {}, size: {}",
                file.getOriginalFilename(), file.getSize());

        ExpenseAttachmentUploadResponse response = expenseAttachmentStorageService.store(file, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "File uploaded successfully"));
    }

    @GetMapping("/{fileName}")
    @Operation(summary = "View / Download Expense Attachment", description = "Retrieves an expense attachment by server-side filename with inline browser viewing")
    public ResponseEntity<Resource> viewAttachment(
            @PathVariable String fileName,
            @RequestParam(required = false) UUID companyId) {

        log.info("GET /api/account/v1/expenses/attachments/{} - Fetching attachment", fileName);
        Resource resource = expenseAttachmentStorageService.load(fileName, companyId);
        String contentType = expenseAttachmentStorageService.getContentType(fileName);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
