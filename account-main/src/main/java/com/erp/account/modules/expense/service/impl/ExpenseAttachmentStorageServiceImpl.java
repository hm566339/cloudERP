package com.erp.account.modules.expense.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.expense.dto.ExpenseAttachmentUploadResponse;
import com.erp.account.modules.expense.service.ExpenseAttachmentStorageService;
import com.erp.account.util.TenantUtils;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class ExpenseAttachmentStorageServiceImpl implements ExpenseAttachmentStorageService {

    private static final String ATTACHMENT_API_PREFIX = "/api/account/v1/expenses/attachments/";

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "pdf"
    );

    private static final Map<String, String> EXTENSION_TO_MIME = Map.of(
            "jpg", MediaType.IMAGE_JPEG_VALUE,
            "jpeg", MediaType.IMAGE_JPEG_VALUE,
            "png", MediaType.IMAGE_PNG_VALUE,
            "pdf", MediaType.APPLICATION_PDF_VALUE
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            "image/jpg",
            MediaType.IMAGE_PNG_VALUE,
            MediaType.APPLICATION_PDF_VALUE
    );

    @Value("${expense.attachment.storage-path:uploads/expenses}")
    private String storagePathProperty;

    @Value("${expense.attachment.max-size:10MB}")
    private String maxSizeProperty;

    private Path rootStoragePath;
    private long maxSizeBytes;

    @PostConstruct
    public void init() {
        this.rootStoragePath = Paths.get(storagePathProperty).toAbsolutePath().normalize();
        try {
            this.maxSizeBytes = DataSize.parse(maxSizeProperty).toBytes();
        } catch (Exception e) {
            log.warn("Failed to parse expense.attachment.max-size '{}', defaulting to 10MB", maxSizeProperty);
            this.maxSizeBytes = 10L * 1024 * 1024;
        }

        try {
            Files.createDirectories(rootStoragePath);
            log.info("Expense attachment storage directory initialized at: {}, max size: {} bytes",
                    rootStoragePath, maxSizeBytes);
        } catch (IOException e) {
            log.error("Could not create expense attachment directory: {}", rootStoragePath, e);
        }
    }

    @Override
    public ExpenseAttachmentUploadResponse store(MultipartFile file, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);

        validateFile(file);

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment"
        );
        String extension = getFileExtension(originalFilename);

        String storedFileName = UUID.randomUUID() + "." + extension;
        Path companyDir = rootStoragePath.resolve(companyId.toString()).normalize();

        try {
            Files.createDirectories(companyDir);
            Path destinationPath = companyDir.resolve(storedFileName).normalize();

            // Guard against path traversal
            if (!destinationPath.startsWith(companyDir)) {
                throw new BadRequestException("Invalid path traversal detected in attachment filename");
            }

            Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored bill attachment '{}' as '{}' for company {}", originalFilename, storedFileName, companyId);

            String fileUrl = ATTACHMENT_API_PREFIX + storedFileName;
            String resolvedContentType = EXTENSION_TO_MIME.getOrDefault(extension, MediaType.APPLICATION_OCTET_STREAM_VALUE);

            return ExpenseAttachmentUploadResponse.builder()
                    .fileUrl(fileUrl)
                    .fileName(originalFilename)
                    .storedFileName(storedFileName)
                    .contentType(resolvedContentType)
                    .size(file.getSize())
                    .build();

        } catch (IOException e) {
            log.error("Failed to store bill attachment '{}' for company {}", originalFilename, companyId, e);
            throw new RuntimeException("Failed to store attachment file: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource load(String fileName, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);

        if (fileName == null || fileName.isBlank() || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new BadRequestException("Invalid attachment filename: " + fileName);
        }

        Path companyDir = rootStoragePath.resolve(companyId.toString()).normalize();
        Path filePath = companyDir.resolve(fileName).normalize();

        if (!filePath.startsWith(companyDir) || !Files.exists(filePath) || !Files.isReadable(filePath)) {
            log.warn("Attachment '{}' not found or inaccessible for company {}", fileName, companyId);
            throw new ResourceNotFoundException("Expense attachment not found or access denied: " + fileName);
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Expense attachment cannot be read: " + fileName);
            }
        } catch (MalformedURLException e) {
            throw new BadRequestException("Error reading attachment URL: " + fileName, e);
        }
    }

    @Override
    public void delete(String fileUrl, UUID requestCompanyId) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        String fileName = extractFileName(fileUrl);
        if (fileName == null) {
            return;
        }

        Path companyDir = rootStoragePath.resolve(companyId.toString()).normalize();
        Path filePath = companyDir.resolve(fileName).normalize();

        if (filePath.startsWith(companyDir) && Files.exists(filePath)) {
            try {
                Files.delete(filePath);
                log.info("Deleted attachment '{}' for company {}", fileName, companyId);
            } catch (IOException e) {
                log.warn("Failed to delete attachment '{}' for company {}", fileName, companyId, e);
            }
        }
    }

    @Override
    public boolean isValidAttachmentUrl(String fileUrl, UUID requestCompanyId) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return true; // Optional attachment
        }

        if (!fileUrl.startsWith(ATTACHMENT_API_PREFIX) && !fileUrl.startsWith("/expenses/attachments/")) {
            return false;
        }

        String fileName = extractFileName(fileUrl);
        if (fileName == null || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return false;
        }

        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        Path companyDir = rootStoragePath.resolve(companyId.toString()).normalize();
        Path filePath = companyDir.resolve(fileName).normalize();

        return filePath.startsWith(companyDir) && Files.exists(filePath);
    }

    @Override
    public String getContentType(String fileName) {
        if (fileName == null) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        String ext = getFileExtension(fileName);
        return EXTENSION_TO_MIME.getOrDefault(ext, MediaType.APPLICATION_OCTET_STREAM_VALUE);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() == 0) {
            throw new BadRequestException("Attachment file cannot be empty.");
        }

        if (file.getSize() > maxSizeBytes) {
            throw new BadRequestException(
                    "Attachment file size exceeds the maximum allowed limit of " + maxSizeProperty
            );
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("Unsupported attachment type. Only JPG, JPEG, PNG and PDF files are allowed.");
        }

        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException(
                    "Unsupported attachment type. Only JPG, JPEG, PNG and PDF files are allowed."
            );
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String lowerContentType = contentType.toLowerCase(Locale.ROOT).trim();
            // In case of multipart or parameters (e.g. image/jpeg;charset=UTF-8)
            int semiIdx = lowerContentType.indexOf(';');
            if (semiIdx > 0) {
                lowerContentType = lowerContentType.substring(0, semiIdx).trim();
            }

            if (!ALLOWED_MIME_TYPES.contains(lowerContentType)) {
                throw new BadRequestException(
                        "Unsupported attachment type. Only JPG, JPEG, PNG and PDF files are allowed."
                );
            }
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex + 1).toLowerCase(Locale.ROOT).trim();
        }
        return "";
    }

    private String extractFileName(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return null;
        int idx = fileUrl.lastIndexOf('/');
        if (idx >= 0 && idx < fileUrl.length() - 1) {
            return fileUrl.substring(idx + 1).trim();
        }
        return fileUrl.trim();
    }
}
