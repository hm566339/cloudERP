package com.erp.account.modules.apinvoice.service;

import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceResponse;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceProfileResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceFilterDto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.util.AgingReportHelper;
import com.erp.account.util.Invoice;
import com.erp.account.util.AgingReportHelper.AgingBucketSummary;

/**
 * Service interface for AP Invoice Management
 */
public interface ApInvoiceService {

        ApInvoiceResponse createInvoice(UUID companyId, RequestWrapper<ApInvoiceRequest> request);

        ApInvoiceResponse updateInvoice(UUID invoiceId, RequestWrapper<ApInvoiceRequest> request);

        void deleteInvoice(UUID invoiceId);

        ApInvoiceProfileResponse getInvoiceById(UUID invoiceId);

        ApInvoiceProfileResponse adjustAdvance(UUID invoiceId,
                        com.erp.account.modules.apinvoice.dto.request.AdvanceAdjustmentRequest request);

        // ============================================================
        // STATUS UPDATES
        // ============================================================

        @Deprecated(since = "2.0", forRemoval = true)
        ApInvoiceResponse updateInvoiceStatus(UUID invoiceId, InvoiceStatus status);

        @Deprecated(since = "2.0", forRemoval = true)
        ApInvoiceResponse updatePostingStatus(UUID invoiceId, com.erp.account.enums.PostingStatus postingStatus);

        ApInvoiceResponse submitForApproval(UUID invoiceId);

        ApInvoiceResponse approveInvoice(UUID invoiceId);

        ApInvoiceResponse rejectInvoice(UUID invoiceId);

        ApInvoiceResponse cancelInvoice(UUID invoiceId);

        ApInvoiceResponse postInvoice(UUID invoiceId);

        ApInvoiceResponse reverseInvoice(UUID invoiceId);

        ApInvoiceResponse voidInvoice(UUID invoiceId);

        ApInvoiceResponse writeOffInvoice(UUID invoiceId);

        ApInvoiceResponse createInvoiceFromGrn(UUID companyId, UUID grnId);

        // ============================================================
        // INVOICE SEARCH & RETRIEVAL
        // ============================================================

        Page<ApInvoiceResponse> getAllInvoices(UUID companyId, ApInvoiceFilterDto filter, Pageable pageable);

        Page<ApInvoiceResponse> getInvoicesByStatus(UUID companyId, InvoiceStatus status, Pageable pageable);

        Page<ApInvoiceResponse> getInvoicesByDateRange(UUID companyId, LocalDate startDate, LocalDate endDate,
                        Pageable pageable);

        Page<ApInvoiceResponse> getInvoicesByAmountRange(UUID companyId, BigDecimal minAmount, BigDecimal maxAmount,
                        Pageable pageable);

        // ============================================================
        // PAYMENT TRACKING
        // ============================================================

        ApInvoiceResponse markAsPartiallyPaid(UUID invoiceId, BigDecimal paidAmount);

        Page<ApInvoiceResponse> getPendingApprovalInvoices(UUID companyId, Pageable pageable);

        // ============================================================
        // OVERDUE ANALYSIS
        // ============================================================

        int getDaysOverdue(UUID invoiceId);

        // ============================================================
        // AGING ANALYSIS
        // ============================================================

        Map<String, AgingBucketSummary> getInvoiceAgingReport(UUID companyId);

        Page<ApInvoiceResponse> getInvoicesByAgingBucket(UUID companyId, int minDays, int maxDays, Pageable pageable);

        // ============================================================
        // VENDOR TRANSACTION HISTORY
        // ============================================================

        Page<ApInvoiceResponse> getVendorTransactionHistory(UUID companyId, UUID vendorId, LocalDate startDate,
                        LocalDate endDate, Pageable pageable);

        BigDecimal getVendorInvoicedAmount(UUID vendorId, LocalDate startDate, LocalDate endDate);

        // ============================================================
        // FINANCIAL REPORTING
        // ============================================================

        BigDecimal getTotalOutstandingAmount(UUID companyId);

        BigDecimal getTotalPostedAmount(UUID companyId);

        BigDecimal getTotalPaidAmount(UUID companyId);

        // ============================================================
        // VALIDATION HELPERS
        // ============================================================

        void validateInvoice(ApInvoiceRequest request, UUID companyId);

        void validateDuplicateInvoiceNumber(String invoiceNo, UUID companyId);

        void validateVendor(UUID vendorId, UUID companyId);
}
