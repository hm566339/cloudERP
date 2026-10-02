package com.erp.account.modules.salesinvoice.repository;

import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import com.erp.account.util.Invoice;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.erp.account.modules.company.entity.Company;


/**
 * Repository interface for Sales Invoice Item entities
 *
 * Provides query operations for sales invoice line items with:
 * - Company-level data isolation
 * - Invoice-specific queries
 * - Amount and tax aggregations
 * - HSN/SAC-based filtering
 *
 * @author ERP System
 * @since 1.0.0
 */
@Repository
public interface SalesInvoiceItemRepository extends JpaRepository<SalesInvoiceItem, UUID> {

    // ============================================================
    // BASIC QUERIES
    // ============================================================

    /**
     * Find all items for a sales invoice
     */
    List<SalesInvoiceItem> findBySalesInvoiceId(UUID salesInvoiceId);

    /**
     * Find items for a sales invoice with pagination
     */
    Page<SalesInvoiceItem> findBySalesInvoiceId(UUID salesInvoiceId, Pageable pageable);

    /**
     * Find items by company
     */
    List<SalesInvoiceItem> findByCompanyId(UUID companyId);

    /**
     * Find items by HSN/SAC code
     */
    List<SalesInvoiceItem> findByHsnSacMasterId(UUID hsnSacId);

    // ============================================================
    // AGGREGATION QUERIES
    // ============================================================

    /**
     * Sum of taxable amounts for an invoice
     */
    @Query("SELECT SUM(i.taxableAmount) FROM SalesInvoiceItem i WHERE i.salesInvoice.id = :invoiceId")
    BigDecimal sumTaxableAmountByInvoice(@Param("invoiceId") UUID invoiceId);

    /**
     * Sum of tax amounts for an invoice
     */
    @Query("SELECT SUM(i.taxAmount) FROM SalesInvoiceItem i WHERE i.salesInvoice.id = :invoiceId")
    BigDecimal sumTaxAmountByInvoice(@Param("invoiceId") UUID invoiceId);

    /**
     * Sum of total amounts for an invoice
     */
    @Query("SELECT SUM(i.totalAmount) FROM SalesInvoiceItem i WHERE i.salesInvoice.id = :invoiceId")
    BigDecimal sumTotalAmountByInvoice(@Param("invoiceId") UUID invoiceId);

    /**
     * Count items in an invoice
     */
    @Query("SELECT COUNT(i) FROM SalesInvoiceItem i WHERE i.salesInvoice.id = :invoiceId")
    long countByInvoice(@Param("invoiceId") UUID invoiceId);

    // ============================================================
    // COMPANY-SCOPED QUERIES
    // ============================================================

    /**
     * Find items by company with pagination
     */
    Page<SalesInvoiceItem> findByCompanyId(UUID companyId, Pageable pageable);

    /**
     * Sum of quantities by HSN/SAC and company (for analytics)
     */
    @Query("SELECT SUM(i.quantity) FROM SalesInvoiceItem i " +
           "WHERE i.company.id = :companyId AND i.hsnSacMaster.id = :hsnSacId")
    BigDecimal sumQuantityByHsnAndCompany(@Param("companyId") UUID companyId, @Param("hsnSacId") UUID hsnSacId);

    /**
     * Sum of tax by HSN/SAC and company (for tax analytics)
     */
    @Query("SELECT SUM(i.taxAmount) FROM SalesInvoiceItem i " +
           "WHERE i.company.id = :companyId AND i.hsnSacMaster.id = :hsnSacId")
    BigDecimal sumTaxByHsnAndCompany(@Param("companyId") UUID companyId, @Param("hsnSacId") UUID hsnSacId);

    // ============================================================
    // TAX-RELATED QUERIES
    // ============================================================

    /**
     * Sum of CGST amounts by invoice
     */
    @Query("SELECT SUM(i.cgstAmount) FROM SalesInvoiceItem i WHERE i.salesInvoice.id = :invoiceId")
    BigDecimal sumCgstByInvoice(@Param("invoiceId") UUID invoiceId);

    /**
     * Sum of SGST amounts by invoice
     */
    @Query("SELECT SUM(i.sgstAmount) FROM SalesInvoiceItem i WHERE i.salesInvoice.id = :invoiceId")
    BigDecimal sumSgstByInvoice(@Param("invoiceId") UUID invoiceId);

    /**
     * Sum of IGST amounts by invoice
     */
    @Query("SELECT SUM(i.igstAmount) FROM SalesInvoiceItem i WHERE i.salesInvoice.id = :invoiceId")
    BigDecimal sumIgstByInvoice(@Param("invoiceId") UUID invoiceId);

    /**
     * Sum of CESS amounts by invoice
     */
    @Query("SELECT SUM(i.cessAmount) FROM SalesInvoiceItem i WHERE i.salesInvoice.id = :invoiceId")
    BigDecimal sumCessByInvoice(@Param("invoiceId") UUID invoiceId);

    // ============================================================
    // FILTERING QUERIES
    // ============================================================

    /**
     * Find items with taxable amount >= threshold
     */
    @Query("SELECT i FROM SalesInvoiceItem i WHERE i.company.id = :companyId " +
           "AND i.taxableAmount >= :minAmount ORDER BY i.taxableAmount DESC")
    Page<SalesInvoiceItem> findHighValueItems(@Param("companyId") UUID companyId,
                                              @Param("minAmount") BigDecimal minAmount,
                                              Pageable pageable);

    /**
     * Find items with specific tax rate
     */
    @Query("SELECT i FROM SalesInvoiceItem i WHERE i.company.id = :companyId " +
           "AND i.cgstAmount > 0 AND i.sgstAmount > 0")
    List<SalesInvoiceItem> findIntraStateItems(@Param("companyId") UUID companyId);

    /**
     * Find items with IGST (inter-state)
     */
    @Query("SELECT i FROM SalesInvoiceItem i WHERE i.company.id = :companyId " +
           "AND i.igstAmount > 0")
    List<SalesInvoiceItem> findInterStateItems(@Param("companyId") UUID companyId);
}

