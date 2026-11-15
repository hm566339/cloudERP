package com.erp.crm.modules.lead.service.serviceImpl;

import com.erp.crm.common.exception.BadRequestException;
import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.security.CurrentUserContext;
import com.erp.crm.common.util.PhoneUtils;
import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.integration.entity.CrmLeadImportBatch;
import com.erp.crm.modules.integration.repository.CrmLeadImportBatchRepository;
import com.erp.crm.modules.lead.dto.importbatch.LeadImportSummaryResponse;
import com.erp.crm.modules.lead.entity.CrmLead;
import com.erp.crm.modules.lead.enums.LeadRating;
import com.erp.crm.modules.lead.enums.LeadStage;
import com.erp.crm.modules.lead.repository.CrmLeadRepository;
import com.erp.crm.modules.lead.service.CrmLeadImportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrmLeadImportServiceImpl implements CrmLeadImportService {

    private final CrmLeadImportBatchRepository importBatchRepository;
    private final CrmLeadRepository leadRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public LeadImportSummaryResponse importLeadsCsv(MultipartFile file, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded CSV file cannot be empty");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "leads_import.csv";
        if (!originalFilename.toLowerCase().endsWith(".csv")) {
            throw new BadRequestException("Only .csv files are supported for lead import");
        }

        log.info("Starting CSV lead import for file: [{}] in company: [{}]", originalFilename, companyId);

        CrmLeadImportBatch batch = CrmLeadImportBatch.builder()
                .fileName(originalFilename)
                .fileStorageUrl("local://batch/" + System.currentTimeMillis() + "_" + originalFilename)
                .totalRecords(0)
                .importedCount(0)
                .duplicateCount(0)
                .failedCount(0)
                .status("PROCESSING")
                .mappingConfigJson("{}")
                .build();
        batch.setCompanyId(companyId);
        CrmLeadImportBatch savedBatch = importBatchRepository.save(batch);

        List<LeadImportSummaryResponse.RowErrorDetail> errors = new ArrayList<>();
        int totalRows = 0;
        int importedCount = 0;
        int duplicateCount = 0;
        int failedCount = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.isBlank()) {
                throw new BadRequestException("CSV file contains no header row");
            }

            Map<String, Integer> headerMap = parseHeaders(headerLine);
            String line;
            int rowNum = 1;

            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (line.trim().isEmpty()) {
                    continue;
                }
                totalRows++;

                try {
                    List<String> columns = parseCsvLine(line);
                    String firstName = sanitize(getCol(columns, headerMap, "firstname", "first_name", "first name", "name"));
                    String lastName = sanitize(getCol(columns, headerMap, "lastname", "last_name", "last name"));
                    String orgName = sanitize(getCol(columns, headerMap, "organization", "organizationname", "company", "company_name"));
                    String rawEmail = sanitize(getCol(columns, headerMap, "email", "email_address"));
                    String rawPhone = sanitize(getCol(columns, headerMap, "phone", "mobile", "contact"));
                    String state = sanitize(getCol(columns, headerMap, "state", "region"));
                    String gstin = sanitize(getCol(columns, headerMap, "gstin", "gst"));
                    String notes = sanitize(getCol(columns, headerMap, "notes", "remark", "comments"));

                    if ((firstName == null || firstName.isBlank()) && (orgName == null || orgName.isBlank())) {
                        throw new IllegalArgumentException("Row must have at least a Name or Organization");
                    }
                    if ((rawPhone == null || rawPhone.isBlank()) && (rawEmail == null || rawEmail.isBlank())) {
                        throw new IllegalArgumentException("Row must have at least a Phone or Email");
                    }

                    String normalizedPhone = rawPhone != null ? PhoneUtils.normalizePhone(rawPhone) : null;
                    String normalizedEmail = rawEmail != null ? rawEmail.trim().toLowerCase() : null;

                    // Deduplication check
                    boolean isDup = false;
                    if (normalizedPhone != null && leadRepository
                            .findByCompanyIdAndNormalizedPhoneAndIsDeletedFalse(companyId, normalizedPhone).isPresent()) {
                        isDup = true;
                    } else if (normalizedEmail != null && leadRepository
                            .findByCompanyIdAndNormalizedEmailAndIsDeletedFalse(companyId, normalizedEmail).isPresent()) {
                        isDup = true;
                    }

                    if (isDup) {
                        duplicateCount++;
                        continue;
                    }

                    String displayName = firstName != null ? (lastName != null ? firstName + " " + lastName : firstName) : orgName;

                    CrmLead lead = CrmLead.builder()
                            .leadCode("LD-" + LocalDate.now().getYear() + "-" + String.format("%05d", ThreadLocalRandom.current().nextInt(1, 99999)))
                            .firstName(firstName)
                            .lastName(lastName)
                            .displayName(displayName)
                            .organizationName(orgName)
                            .phone(rawPhone)
                            .normalizedPhone(normalizedPhone)
                            .email(rawEmail)
                            .normalizedEmail(normalizedEmail)
                            .state(state)
                            .gstin(gstin)
                            .rawInquiryText(notes)
                            .leadScore(50)
                            .scoreGrade(LeadRating.WARM)
                            .leadStage(LeadStage.RAW)
                            .ownerUserId(TenantUtils.getCurrentUserId())
                            .build();
                    lead.setCompanyId(companyId);

                    leadRepository.save(lead);
                    importedCount++;
                } catch (Exception ex) {
                    failedCount++;
                    errors.add(LeadImportSummaryResponse.RowErrorDetail.builder()
                            .rowNumber(rowNum)
                            .rawLine(line.length() > 100 ? line.substring(0, 100) + "..." : line)
                            .reason(ex.getMessage())
                            .build());
                }
            }

            savedBatch.setTotalRecords(totalRows);
            savedBatch.setImportedCount(importedCount);
            savedBatch.setDuplicateCount(duplicateCount);
            savedBatch.setFailedCount(failedCount);
            savedBatch.setStatus(failedCount == 0 ? "COMPLETED" : (importedCount > 0 ? "PARTIALLY_COMPLETED" : "FAILED"));

            if (!errors.isEmpty()) {
                savedBatch.setErrorReportUrl("data:application/json;base64," + Base64.getEncoder().encodeToString(
                        objectMapper.writeValueAsBytes(errors)));
            }

            importBatchRepository.save(savedBatch);
            log.info("Batch [{}] finished: total={}, imported={}, dup={}, failed={}",
                    savedBatch.getId(), totalRows, importedCount, duplicateCount, failedCount);

        } catch (Exception e) {
            log.error("Fatal failure in CSV batch import [{}]: {}", savedBatch.getId(), e.getMessage());
            savedBatch.setStatus("FAILED");
            importBatchRepository.save(savedBatch);
            throw new BadRequestException("Failed to process CSV file: " + e.getMessage());
        }

        return LeadImportSummaryResponse.builder()
                .batchId(savedBatch.getId())
                .companyId(companyId)
                .fileName(originalFilename)
                .totalRecords(totalRows)
                .importedCount(importedCount)
                .duplicateCount(duplicateCount)
                .failedCount(failedCount)
                .status(savedBatch.getStatus())
                .errorReportUrl(savedBatch.getErrorReportUrl())
                .createdAt(savedBatch.getCreatedAt())
                .errors(errors)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CrmLeadImportBatch> getImportBatches(UUID companyId) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        return importBatchRepository.findByCompanyIdAndIsDeletedFalseOrderByCreatedAtDesc(effectiveCompanyId);
    }

    @Override
    @Transactional(readOnly = true)
    public CrmLeadImportBatch getBatchById(UUID batchId, UUID companyId) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        return importBatchRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Import batch not found: " + batchId));
    }

    private Map<String, Integer> parseHeaders(String headerLine) {
        Map<String, Integer> map = new HashMap<>();
        List<String> headers = parseCsvLine(headerLine);
        for (int i = 0; i < headers.size(); i++) {
            String col = headers.get(i).trim().toLowerCase().replaceAll("[^a-z0-9_ ]", "");
            map.put(col, i);
        }
        return map;
    }

    private String getCol(List<String> cols, Map<String, Integer> headerMap, String... candidates) {
        for (String c : candidates) {
            if (headerMap.containsKey(c)) {
                int idx = headerMap.get(c);
                if (idx < cols.size()) {
                    String val = cols.get(idx).trim();
                    return val.isEmpty() ? null : val;
                }
            }
        }
        return null;
    }

    /**
     * Prevents CSV Formula Injection (=, +, -, @, tab, newline prefix).
     */
    private String sanitize(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        char firstChar = input.charAt(0);
        if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r') {
            return "'" + input;
        }
        return input;
    }

    private List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(cur.toString().trim());
                cur.setLength(0);
            } else {
                cur.append(c);
            }
        }
        result.add(cur.toString().trim());
        return result;
    }
}
