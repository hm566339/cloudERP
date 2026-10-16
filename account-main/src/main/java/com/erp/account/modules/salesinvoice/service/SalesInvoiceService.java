package com.erp.account.modules.salesinvoice.service;

import com.erp.account.modules.salesinvoice.dto.SalesInvoiceRequest;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceProfileResponse;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceFilterDto;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.util.Invoice;
import com.erp.account.util.TenantUtils;

/**
 * Service Interface for Sales Invoice Management
 * 
 * Defines contracts for all sales invoice business operations.
 * All operations respect multi-company architecture and data isolation via
 * TenantUtils.
 */
public interface SalesInvoiceService {

    // ============================================================
    // CRUD OPERATIONS
    // ============================================================

    SalesInvoiceResponse createInvoice(RequestWrapper<SalesInvoiceRequest> request, UUID companyId);

    SalesInvoiceResponse updateInvoice(UUID invoiceId, RequestWrapper<SalesInvoiceRequest> request);

    void deleteInvoice(UUID invoiceId);

    // ============================================================
    // QUERY OPERATIONS - BASIC
    // ============================================================

    SalesInvoiceProfileResponse getInvoiceById(UUID invoiceId);

    SalesInvoiceResponse getInvoiceByNumber(String invoiceNumber);

    Page<SalesInvoiceResponse> getAllInvoices(SalesInvoiceFilterDto filter, Pageable pageable);

    Page<SalesInvoiceResponse> getCustomerInvoices(UUID customerId, Pageable pageable);

    Page<SalesInvoiceResponse> getInvoicesByStatus(InvoiceStatus status, Pageable pageable, UUID companyId);

    // ============================================================
    // PAYMENT & OUTSTANDING QUERIES
    // ============================================================

    Page<SalesInvoiceResponse> getOutstandingInvoices(Pageable pageable);

    Page<SalesInvoiceResponse> getOverdueInvoices(LocalDate asOfDate, Pageable pageable);

    BigDecimal getCustomerOutstandingBalance(UUID customerId);

    AgingReportDTO getInvoiceAging(LocalDate asOfDate);

    // ============================================================
    // WORKFLOW OPERATIONS
    // ============================================================

    SalesInvoiceResponse submitForApproval(UUID invoiceId, String comments);

    SalesInvoiceResponse submitForApproval(UUID companyId, UUID invoiceId, String comments);

    void approveInvoice(UUID invoiceId);

    void rejectInvoice(UUID invoiceId);

    void postInvoice(UUID invoiceId);

    void cancelInvoice(UUID invoiceId);

    // ============================================================
    // VALIDATION & CALCULATION OPERATIONS
    // ============================================================

    void validateInvoice(SalesInvoiceRequest invoice);

    void validateInvoice(UUID invoiceId, SalesInvoiceRequest invoice);

    SalesInvoiceResponse recalculateInvoiceTotals(UUID invoiceId);

    // ============================================================
    // GL POSTING OPERATIONS
    // ============================================================

    UUID generateGlPosting(UUID invoiceId);

    // ============================================================
    // DATA AGGREGATION & REPORTING
    // ============================================================

    SalesInvoiceSummaryDTO getSalesSummary();

    CustomerSalesSummaryDTO getCustomerSalesSummary(UUID customerId);

    // ============================================================
    // INNER DTO CLASSES FOR REPORTING
    // ============================================================

    class AgingReportDTO {
        public BigDecimal amount0to30Days;
        public BigDecimal amount31to60Days;
        public BigDecimal amount61to90Days;
        public BigDecimal amount90PlusDays;
        public Long count0to30Days;
        public Long count31to60Days;
        public Long count61to90Days;
        public Long count90PlusDays;
    }

    class SalesInvoiceSummaryDTO {
        public Long totalInvoices;
        public BigDecimal totalAmount;
        public BigDecimal receivedAmount;
        public BigDecimal outstandingAmount;
        public BigDecimal overdueAmount;
    }

    class CustomerSalesSummaryDTO {
        public UUID customerId;
        public String customerName;
        public Long totalInvoices;
        public BigDecimal totalAmount;
        public BigDecimal receivedAmount;
        public BigDecimal outstandingAmount;
        public BigDecimal overdueAmount;
        public BigDecimal creditLimit;
    }
}
