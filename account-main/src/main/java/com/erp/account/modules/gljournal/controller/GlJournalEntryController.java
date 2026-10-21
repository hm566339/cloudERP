package com.erp.account.modules.gljournal.controller;

import com.erp.account.modules.reporting.dto.response.BalanceSheetReport;
import com.erp.account.modules.reporting.dto.response.GeneralLedgerLine;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryListResponse;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryResponse;
import com.erp.account.modules.reporting.dto.response.ProfitLossReport;
import com.erp.account.modules.reporting.dto.response.TrialBalanceLine;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryFilterDto;
import com.erp.account.util.TenantUtils;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.common.service.GlJournalPdfService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/gl/journals")
@AllArgsConstructor
@Slf4j
public class GlJournalEntryController {

    private final GlJournalEntryService glJournalEntryService;
    private final GlJournalPdfService glJournalPdfService;

    @PostMapping
    public ResponseEntity<ApiResponse<GlJournalEntryResponse>> createJournalEntry(
            @Valid @RequestBody RequestWrapper<GlJournalEntryRequest> requestWrapper,
            @RequestParam(required = false) UUID companyIdUUID) {
        GlJournalEntryRequest request = requestWrapper.unwrap();
        log.info("Received request to create GL journal entry");
        GlJournalEntryResponse response = glJournalEntryService.createJournalEntry(requestWrapper, companyIdUUID);
        return ResponseEntity.ok(ApiResponse.success(response, "GL journal entry created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GlJournalEntryResponse>> updateJournalEntry(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<GlJournalEntryRequest> requestWrapper) {
        GlJournalEntryRequest request = requestWrapper.unwrap();
        log.info("Received request to update GL journal entry {}", id);
        GlJournalEntryResponse response = glJournalEntryService.updateJournalEntry(id, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "GL journal entry updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> deleteJournalEntry(@PathVariable UUID id) {
        log.info("Received request to delete GL journal entry {}", id);
        glJournalEntryService.deleteJournalEntry(id);
        return ResponseEntity.ok(ApiResponse.success(PostResponse.builder()
                .message("Journal entry deleted successfully").build(), "Journal entry deleted successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse>> getJournalEntryById(
            @PathVariable UUID id) {
        log.info("Received request to get GL journal entry profile {}", id);
        com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse response = glJournalEntryService
                .getJournalProfileById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "GL journal entry profile retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<GlJournalEntryListResponse>>> searchJournalEntries(
            @ModelAttribute GlJournalEntryFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        log.info("Received request to search GL journal entries with filter {}", filter);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<GlJournalEntryListResponse> result = glJournalEntryService.getAllJournals(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(result, "GL journal entries retrieved successfully"));
    }

    @PostMapping("/{id}/post")
    public ResponseEntity<ApiResponse<GlJournalEntryResponse>> postJournalEntry(@PathVariable UUID id) {
        log.info("Received request to post GL journal entry {}", id);
        GlJournalEntryResponse response = glJournalEntryService.postJournalEntry(id);
        return ResponseEntity.ok(ApiResponse.success(response, "GL journal entry posted successfully"));
    }

    @PostMapping("/{id}/reverse")
    public ResponseEntity<ApiResponse<GlJournalEntryResponse>> reverseJournalEntry(@PathVariable UUID id) {
        log.info("Received request to reverse GL journal entry {}", id);
        GlJournalEntryResponse response = glJournalEntryService.reverseJournalEntry(id);
        return ResponseEntity.ok(ApiResponse.success(response, "GL journal entry reversed successfully"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<PostResponse>> cancelJournalEntry(@PathVariable UUID id) {
        log.info("Received request to cancel GL journal entry {}", id);
        glJournalEntryService.cancelJournalEntry(id);
        return ResponseEntity.ok(ApiResponse.success(PostResponse.builder()
                .message("Journal entry cancelled successfully").build(), "Journal entry cancelled successfully"));
    }

    @GetMapping("/trial-balance")
    public ResponseEntity<ApiResponse<Page<TrialBalanceLine>>> getTrialBalance(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) UUID companyId) {
        UUID resolvedCompanyId = (com.erp.account.util.TenantUtils.isSystemAdmin() && companyId != null)
                ? companyId
                : com.erp.account.util.TenantUtils.getCurrentCompanyId();
        log.info("Received request for trial balance report for company {}", resolvedCompanyId);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<TrialBalanceLine> pageResponse = glJournalEntryService.getTrialBalance(resolvedCompanyId, startDate,
                endDate,
                pageable);
        return ResponseEntity.ok(ApiResponse.success(pageResponse, "Trial balance retrieved successfully"));
    }

    @GetMapping("/general-ledger")
    public ResponseEntity<ApiResponse<Page<GeneralLedgerLine>>> getGeneralLedger(
            @RequestParam UUID accountId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) UUID companyId) {
        UUID resolvedCompanyId = (com.erp.account.util.TenantUtils.isSystemAdmin() && companyId != null)
                ? companyId
                : com.erp.account.util.TenantUtils.getCurrentCompanyId();
        log.info("Received request for general ledger for account {}", accountId);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<GeneralLedgerLine> pageResponse = glJournalEntryService.getAccountLedger(resolvedCompanyId, accountId,
                startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(pageResponse, "General ledger retrieved successfully"));
    }

    @GetMapping("/balance-sheet")
    public ResponseEntity<ApiResponse<BalanceSheetReport>> getBalanceSheet(
            @RequestParam UUID fiscalYearId,
            @RequestParam(required = false) UUID companyId) {
        UUID resolvedCompanyId = (com.erp.account.util.TenantUtils.isSystemAdmin() && companyId != null)
                ? companyId
                : com.erp.account.util.TenantUtils.getCurrentCompanyId();
        log.info("Received request for balance sheet for company {}", resolvedCompanyId);
        BalanceSheetReport response = glJournalEntryService.getBalanceSheetData(resolvedCompanyId, fiscalYearId);
        return ResponseEntity.ok(ApiResponse.success(response, "Balance sheet retrieved successfully"));
    }

    @GetMapping("/profit-loss")
    public ResponseEntity<ApiResponse<ProfitLossReport>> getProfitLoss(
            @RequestParam UUID fiscalYearId,
            @RequestParam(required = false) UUID companyId) {
        UUID resolvedCompanyId = (com.erp.account.util.TenantUtils.isSystemAdmin() && companyId != null)
                ? companyId
                : com.erp.account.util.TenantUtils.getCurrentCompanyId();
        log.info("Received request for profit and loss for company {}", resolvedCompanyId);
        ProfitLossReport response = glJournalEntryService.getProfitLossData(resolvedCompanyId, fiscalYearId);
        return ResponseEntity.ok(ApiResponse.success(response, "Profit and loss retrieved successfully"));
    }

    // ============================================================
    // PDF DOWNLOAD ENDPOINTS
    // ============================================================

    @GetMapping("/{id}/pdf")
    public void downloadJournalEntryPdf(
            @PathVariable UUID id,
            HttpServletResponse response) {
        try {
            log.info("Received request to download PDF for journal entry {}", id);
            GlJournalEntryResponse journalEntry = glJournalEntryService.getJournalById(id);
            byte[] pdfContent = glJournalPdfService.generateJournalEntryPdf(journalEntry);

            response.setContentType(MediaType.APPLICATION_PDF_VALUE);
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"journal-entry-" + id + ".pdf\"");
            response.setContentLength(pdfContent.length);
            response.getOutputStream().write(pdfContent);
            response.getOutputStream().flush();
        } catch (Exception e) {
            log.error("Error generating PDF for journal entry {}", id, e);
            throw new RuntimeException("Unable to generate PDF", e);
        }
    }

    @GetMapping("/trial-balance/pdf")
    public void downloadTrialBalancePdf(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) UUID companyId,
            HttpServletResponse response) {
        try {
            log.info("Received request to download Trial Balance PDF");
            UUID resolvedCompanyId = (TenantUtils.isSystemAdmin() && companyId != null) ? companyId
                    : TenantUtils.getCurrentCompanyId();
            Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
            Page<TrialBalanceLine> pageResponse = glJournalEntryService.getTrialBalance(resolvedCompanyId, startDate,
                    endDate, pageable);
            byte[] pdfContent = glJournalPdfService.generateTrialBalancePdf(pageResponse.getContent());

            response.setContentType(MediaType.APPLICATION_PDF_VALUE);
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"trial-balance.pdf\"");
            response.setContentLength(pdfContent.length);
            response.getOutputStream().write(pdfContent);
            response.getOutputStream().flush();
        } catch (Exception e) {
            log.error("Error generating Trial Balance PDF", e);
            throw new RuntimeException("Unable to generate PDF", e);
        }
    }

    @GetMapping("/general-ledger/pdf")
    public void downloadGeneralLedgerPdf(
            @RequestParam UUID accountId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) UUID companyId,
            HttpServletResponse response) {
        try {
            log.info("Received request to download General Ledger PDF for account {}", accountId);
            UUID resolvedCompanyId = (TenantUtils.isSystemAdmin() && companyId != null) ? companyId
                    : TenantUtils.getCurrentCompanyId();
            Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
            Page<GeneralLedgerLine> pageResponse = glJournalEntryService.getAccountLedger(resolvedCompanyId, accountId,
                    startDate, endDate, pageable);
            byte[] pdfContent = glJournalPdfService.generateGeneralLedgerPdf(pageResponse.getContent());

            response.setContentType(MediaType.APPLICATION_PDF_VALUE);
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"general-ledger-" + accountId + ".pdf\"");
            response.setContentLength(pdfContent.length);
            response.getOutputStream().write(pdfContent);
            response.getOutputStream().flush();
        } catch (Exception e) {
            log.error("Error generating General Ledger PDF", e);
            throw new RuntimeException("Unable to generate PDF", e);
        }
    }

    @GetMapping("/balance-sheet/pdf")
    public void downloadBalanceSheetPdf(
            @RequestParam UUID fiscalYearId,
            @RequestParam(required = false) UUID companyId,
            HttpServletResponse response) {
        try {
            log.info("Received request to download Balance Sheet PDF");
            UUID resolvedCompanyId = (TenantUtils.isSystemAdmin() && companyId != null) ? companyId
                    : TenantUtils.getCurrentCompanyId();
            BalanceSheetReport balanceSheet = glJournalEntryService.getBalanceSheetData(resolvedCompanyId,
                    fiscalYearId);
            byte[] pdfContent = glJournalPdfService.generateBalanceSheetPdf(balanceSheet);

            response.setContentType(MediaType.APPLICATION_PDF_VALUE);
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"balance-sheet.pdf\"");
            response.setContentLength(pdfContent.length);
            response.getOutputStream().write(pdfContent);
            response.getOutputStream().flush();
        } catch (Exception e) {
            log.error("Error generating Balance Sheet PDF", e);
            throw new RuntimeException("Unable to generate PDF", e);
        }
    }

    @GetMapping("/profit-loss/pdf")
    public void downloadProfitLossPdf(
            @RequestParam UUID fiscalYearId,
            @RequestParam(required = false) UUID companyId,
            HttpServletResponse response) {
        try {
            log.info("Received request to download Profit & Loss PDF");
            UUID resolvedCompanyId = (TenantUtils.isSystemAdmin() && companyId != null) ? companyId
                    : TenantUtils.getCurrentCompanyId();
            ProfitLossReport profitLoss = glJournalEntryService.getProfitLossData(resolvedCompanyId, fiscalYearId);
            byte[] pdfContent = glJournalPdfService.generateProfitLossPdf(profitLoss);

            response.setContentType(MediaType.APPLICATION_PDF_VALUE);
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"profit-loss.pdf\"");
            response.setContentLength(pdfContent.length);
            response.getOutputStream().write(pdfContent);
            response.getOutputStream().flush();
        } catch (Exception e) {
            log.error("Error generating Profit & Loss PDF", e);
            throw new RuntimeException("Unable to generate PDF", e);
        }
    }
}
