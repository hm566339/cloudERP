package com.erp.account.modules.banktransaction.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.banktransaction.dto.BankTransactionRequest;
import com.erp.account.modules.banktransaction.dto.request.BankTransactionFilterDto;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerResponse;
import com.erp.account.modules.banktransaction.dto.response.BankReconciliationResponse;
import com.erp.account.modules.banktransaction.dto.response.BankTransactionListResponse;

import com.erp.account.modules.banktransaction.dto.response.BankTransactionResponse;
import com.erp.account.enums.BankTransactionType;
import com.erp.account.modules.banktransaction.service.BankLedgerPdfService;
import com.erp.account.modules.banktransaction.service.BankTransactionService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;


/**
 * Bank Transaction REST Controller
 * 
 * Provides REST endpoints for bank transaction management:
 * - CRUD operations
 * - Reconciliation
 * - Ledger generation
 * - Balance calculations
 * 
 * All endpoints are company-scoped for multi-tenancy.
 * 
 * @author ERP System
 * @version 1.0
 */
@RestController
@RequestMapping("/api/account/bank-transactions")
@RequiredArgsConstructor
@Slf4j
public class BankTransactionController {

    private final BankTransactionService bankTransactionService;
    private final BankLedgerPdfService bankLedgerPdfService;

    // ==================== TRANSACTION CRUD ====================

    /**
     * Create a new bank transaction
     * 
     * POST /api/bank-transactions
     * 
     * @param request the transaction request DTO
     * @return created transaction response
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BankTransactionResponse>> createTransaction(
            @Valid @RequestBody RequestWrapper<BankTransactionRequest> requestWrapper) {
        BankTransactionRequest request = requestWrapper.unwrap();
        log.info("Creating bank transaction with reference: {}", request.getReferenceNo());

        BankTransactionResponse response = bankTransactionService.createTransaction(requestWrapper);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Bank transaction created successfully"));
    }

    /**
     * Update an existing bank transaction
     * 
     * PUT /api/bank-transactions/{id}
     * 
     * @param id the transaction ID
     * @param request the updated request DTO
     * @return updated transaction response
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BankTransactionResponse>> updateTransaction(
            @PathVariable("id") UUID id,
            @Valid @RequestBody RequestWrapper<BankTransactionRequest> requestWrapper) {
        BankTransactionRequest request = requestWrapper.unwrap();
        log.info("Updating bank transaction: {}", id);

        BankTransactionResponse response = bankTransactionService.updateTransaction(id, requestWrapper);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Bank transaction updated successfully"));
    }

    /**
     * Delete (soft-delete) a bank transaction
     * 
     * DELETE /api/bank-transactions/{id}
     * 
     * @param id the transaction ID
     * @return no content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable("id") UUID id) {
        log.info("Deleting bank transaction: {}", id);

        bankTransactionService.deleteTransaction(id);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Get transaction by ID
     * 
     * GET /api/bank-transactions/{id}
     * 
     * @param id the transaction ID
     * @return transaction response
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BankTransactionResponse>> getTransactionById(
            @PathVariable("id") UUID id) {
        log.debug("Fetching bank transaction: {}", id);

        BankTransactionResponse response = bankTransactionService.getTransactionById(id);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Bank transaction retrieved successfully"));
    }

    /**
     * Get all transactions with advanced filtering and pagination
     * 
     * GET /api/bank-transactions
     * 
     * @param bankAccountId optional bank account ID filter
     * @param transactionType optional transaction type filter
     * @param referenceNo optional reference number filter
     * @param utrNo optional UTR number filter
     * @param reconciled optional reconciliation status filter
     * @param startDate optional start date filter
     * @param endDate optional end date filter
     * @param pageable pagination info
     * @return paginated transaction list
     */
    @GetMapping
    public ResponseEntity<ApiResponse<BankTransactionListResponse>> getAllTransactions(
            @ModelAttribute BankTransactionFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        
        log.debug("Fetching all bank transactions with filters");

        org.springframework.data.domain.Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? org.springframework.data.domain.Sort.Direction.ASC : org.springframework.data.domain.Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "transactionDate";
        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, Math.min(size, 100), org.springframework.data.domain.Sort.by(direction, resolvedSortBy));

        BankTransactionListResponse response = bankTransactionService.getAllTransactions(filter, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Bank transactions retrieved successfully"));
    }

    // ==================== BANK ACCOUNT QUERIES ====================

    /**
     * Get transactions by bank account
     * 
     * GET /api/bank-transactions/bank-account/{bankAccountId}
     * 
     * @param bankAccountId the bank account ID
     * @param pageable pagination info
     * @return paginated transaction list
     */
    @GetMapping("/bank-account/{bankAccountId}")
    public ResponseEntity<ApiResponse<BankTransactionListResponse>> getTransactionsByBankAccount(
            @PathVariable("bankAccountId") UUID bankAccountId,
            Pageable pageable) {
        log.debug("Fetching transactions for bank account: {}", bankAccountId);

        BankTransactionListResponse response = bankTransactionService.getTransactionsByBankAccount(
                bankAccountId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Bank transactions retrieved successfully"));
    }

    /**
     * Get reconciled transactions for a bank account
     * 
     * GET /api/bank-transactions/reconciled?bankAccountId={id}
     * 
     * @param bankAccountId the bank account ID
     * @param pageable pagination info
     * @return paginated reconciled transaction list
     */
    @GetMapping("/reconciled")
    public ResponseEntity<ApiResponse<BankTransactionListResponse>> getReconciledTransactions(
            @RequestParam("bankAccountId") UUID bankAccountId,
            Pageable pageable) {
        log.debug("Fetching reconciled transactions for account: {}", bankAccountId);

        BankTransactionListResponse response = bankTransactionService.getReconciledTransactions(
                bankAccountId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Reconciled transactions retrieved successfully"));
    }

    /**
     * Get unreconciled transactions for a bank account
     * 
     * GET /api/bank-transactions/unreconciled?bankAccountId={id}
     * 
     * @param bankAccountId the bank account ID
     * @param pageable pagination info
     * @return paginated unreconciled transaction list
     */
    @GetMapping("/unreconciled")
    public ResponseEntity<ApiResponse<BankTransactionListResponse>> getUnreconciledTransactions(
            @RequestParam("bankAccountId") UUID bankAccountId,
            Pageable pageable) {
        log.debug("Fetching unreconciled transactions for account: {}", bankAccountId);

        BankTransactionListResponse response = bankTransactionService.getUnreconciledTransactions(
                bankAccountId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Unreconciled transactions retrieved successfully"));
    }

    // ==================== RECONCILIATION ====================

    /**
     * Reconcile a bank transaction
     * 
     * PUT /api/bank-transactions/{id}/reconcile
     * 
     * @param id the transaction ID
     * @return reconciled transaction response
     */
    @PutMapping("/{id}/reconcile")
    public ResponseEntity<ApiResponse<BankTransactionResponse>> reconcileTransaction(
            @PathVariable("id") UUID id) {
        log.info("Reconciling transaction: {}", id);

        BankTransactionResponse response = bankTransactionService.reconcileTransaction(id);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Bank transaction reconciled successfully"));
    }

    /**
     * Unreconcile a bank transaction
     * 
     * PUT /api/bank-transactions/{id}/unreconcile
     * 
     * @param id the transaction ID
     * @return unreconciled transaction response
     */
    @PutMapping("/{id}/unreconcile")
    public ResponseEntity<ApiResponse<BankTransactionResponse>> unreconcileTransaction(
            @PathVariable("id") UUID id) {
        log.info("Unreconciling transaction: {}", id);

        BankTransactionResponse response = bankTransactionService.unreconcileTransaction(id);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Bank transaction unreconciled successfully"));
    }

    // ==================== REVERSAL ====================

    /**
     * Reverse a bank transaction
     * 
     * PUT /api/bank-transactions/{id}/reverse
     * 
     * @param id the transaction ID
     * @param reversalNarration optional narration for the reversal
     * @return reversal transaction response
     */
    @PutMapping("/{id}/reverse")
    public ResponseEntity<ApiResponse<BankTransactionResponse>> reverseTransaction(
            @PathVariable("id") UUID id,
            @RequestParam(value = "narration", required = false) String reversalNarration) {
        log.info("Reversing transaction: {}", id);

        BankTransactionResponse response = bankTransactionService.reverseTransaction(id, reversalNarration);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Bank transaction reversed successfully"));
    }

    // ==================== LEDGER REPORTS ====================

    /**
     * Generate bank ledger for a bank account
     * 
     * GET /api/bank-transactions/ledger?bankAccountId={id}
     * 
     * @param bankAccountId the bank account ID
     * @param pageable pagination info
     * @return bank ledger response
     */
    @GetMapping("/ledger")
    public ResponseEntity<ApiResponse<BankLedgerResponse>> getBankLedger(
            @RequestParam("bankAccountId") UUID bankAccountId,
            Pageable pageable) {
        log.info("Generating bank ledger for account: {}", bankAccountId);

        BankLedgerResponse response = bankTransactionService.getBankLedger(bankAccountId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Bank ledger retrieved successfully"));
    }

    /**
     * Generate bank ledger for date range
     * 
     * GET /api/bank-transactions/ledger/date-range
     * 
     * @param bankAccountId the bank account ID
     * @param startDate start date
     * @param endDate end date
     * @param pageable pagination info
     * @return bank ledger response for date range
     */
    @GetMapping("/ledger/date-range")
    public ResponseEntity<ApiResponse<BankLedgerResponse>> getBankLedgerForDateRange(
            @RequestParam("bankAccountId") UUID bankAccountId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Pageable pageable) {
        log.info("Generating bank ledger for account {} from {} to {}", bankAccountId, startDate, endDate);

        BankLedgerResponse response = bankTransactionService.getBankLedgerForDateRange(
                bankAccountId, startDate, endDate, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Bank ledger retrieved successfully"));
    }

    /**
     * Download bank ledger as PDF
     * 
     * GET /api/account/bank-transactions/ledger/pdf
     * 
     * @param bankAccountId the bank account ID
     * @param startDate start date
     * @param endDate end date
     * @param companyId company ID
     * @param response HTTPServletResponse
     */
    @GetMapping(value = "/ledger/pdf", produces = org.springframework.http.MediaType.APPLICATION_PDF_VALUE)
    public void downloadBankLedgerPdf(
            @RequestParam("bankAccountId") UUID bankAccountId,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "companyId", required = false) UUID companyId,
            HttpServletResponse response) {
        log.info("Downloading bank ledger PDF for account {} from {} to {}", bankAccountId, startDate, endDate);

        try {
            byte[] pdfBytes = bankLedgerPdfService.generateBankLedgerPdf(bankAccountId, startDate, endDate, companyId);
            
            response.setContentType("application/pdf");
            response.setHeader("Content-Disposition", "attachment; filename=\"Bank_Ledger.pdf\"");
            
            org.springframework.util.FileCopyUtils.copy(pdfBytes, response.getOutputStream());
            response.flushBuffer();
        } catch (java.io.IOException e) {
            log.error("Failed to write PDF to response output stream", e);
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    /**
     * Get reconciliation summary for a bank account
     * 
     * GET /api/bank-transactions/reconciliation-summary
     * 
     * @param bankAccountId the bank account ID
     * @param bankStatementBalance the bank statement balance
     * @param pageable pagination info
     * @return reconciliation summary response
     */
    @GetMapping("/reconciliation-summary")
    public ResponseEntity<ApiResponse<BankReconciliationResponse>> getReconciliationSummary(
            @RequestParam("bankAccountId") UUID bankAccountId,
            @RequestParam("bankStatementBalance") BigDecimal bankStatementBalance,
            Pageable pageable) {
        log.info("Generating reconciliation summary for account: {}", bankAccountId);

        BankReconciliationResponse response = bankTransactionService.getReconciliationSummary(
                bankAccountId, bankStatementBalance, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Reconciliation summary retrieved successfully"));
    }
}
