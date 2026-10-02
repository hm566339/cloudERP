package com.erp.account.modules.expense.service;

import com.erp.account.modules.expense.dto.ExpenseAttachmentUploadResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface ExpenseAttachmentStorageService {

    ExpenseAttachmentUploadResponse store(MultipartFile file, UUID companyId);

    Resource load(String fileName, UUID companyId);

    void delete(String fileUrl, UUID companyId);

    boolean isValidAttachmentUrl(String fileUrl, UUID companyId);

    String getContentType(String fileName);
}
