package com.erp.account.modules.salesinvoice.repository;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.util.Invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import com.erp.account.modules.company.entity.Company;


/**
 * Repository interface for Sales Invoice entities
 * 
 * Provides CRUD and query operations for sales invoices with:
 * - Company-level data isolation
 * - Soft-delete support
 * - Advanced filtering and pagination
 * - AR aging queries
 * - Outstanding balance tracking
 * 
 * All queries automatically filter isDeleted = false for integrity
 */
@Repository
public interface SalesInvoiceRepository extends JpaRepository<SalesInvoice, UUID>, JpaSpecificationExecutor<SalesInvoice> {

       // ============================================================
       // BASIC QUERIES
       // ============================================================

       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "customer", "salesInvoiceItems", "salesInvoiceItems.hsnSacMaster", "salesInvoiceItems.hsnSacMaster.gstSlab"})
       Optional<SalesInvoice> findByIdAndIsDeletedFalse(UUID id);

       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "customer", "salesInvoiceItems", "salesInvoiceItems.hsnSacMaster", "salesInvoiceItems.hsnSacMaster.gstSlab"})
       Optional<SalesInvoice> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

       @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
       @org.springframework.data.jpa.repository.QueryHints({@jakarta.persistence.QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000")})
       @Query("SELECT si FROM SalesInvoice si WHERE si.id = :id AND si.companyId = :companyId AND si.isDeleted = false")
       Optional<SalesInvoice> findByIdAndCompanyIdAndIsDeletedFalseWithLock(@Param("id") UUID id, @Param("companyId") UUID companyId);

       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "customer", "salesInvoiceItems", "salesInvoiceItems.hsnSacMaster", "salesInvoiceItems.hsnSacMaster.gstSlab"})
       Optional<SalesInvoice> findByInvoiceNumberAndIsDeletedFalse(String invoiceNumber);

       @Query("""
                     SELECT i FROM SalesInvoice i
                     LEFT JOIN FETCH i.salesInvoiceItems
                     WHERE i.id = :id
                     AND i.isDeleted = false
                     """)
       Optional<SalesInvoice> findByIdWithLineItems(@Param("id") UUID id);

       boolean existsByInvoiceNumberAndCompanyIdAndIsDeletedFalse(String invoiceNumber, UUID companyId);
       
       boolean existsByInvoiceNumberAndCompanyIdAndIdNotAndIsDeletedFalse(String invoiceNumber, UUID companyId, UUID id);

       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "customer", "salesInvoiceItems", "salesInvoiceItems.hsnSacMaster", "salesInvoiceItems.hsnSacMaster.gstSlab"})
       Optional<SalesInvoice> findByInvoiceNumberAndCompanyIdAndIsDeletedFalse(String invoiceNumber, UUID companyId);

       boolean existsBySourceSalesOrderIdAndCompanyIdAndIsDeletedFalse(UUID sourceSalesOrderId, UUID companyId);
       
       Optional<SalesInvoice> findBySourceSalesOrderIdAndCompanyIdAndIsDeletedFalse(UUID sourceSalesOrderId, UUID companyId);

       boolean existsBySourceDeliveryChallanIdAndCompanyIdAndIsDeletedFalse(UUID sourceDeliveryChallanId, UUID companyId);

       Optional<SalesInvoice> findBySourceDeliveryChallanIdAndCompanyIdAndIsDeletedFalse(UUID sourceDeliveryChallanId, UUID companyId);

       // ============================================================
       // COMPANY-SCOPED QUERIES
       // ============================================================

       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "customer"})
       Page<SalesInvoice> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "customer"})
       Page<SalesInvoice> findAllByIsDeletedFalse(Pageable pageable);

       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "customer"})
       Page<SalesInvoice> findByCustomerIdAndCompanyIdAndIsDeletedFalse(UUID customerId, UUID companyId,
                     Pageable pageable);

       // Replaced
       // Page<SalesInvoice> findByCustomerIdAndIsDeletedFalse(UUID customerId, Pageable pageable);

       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "customer"})
       Page<SalesInvoice> findByStatusAndCompanyIdAndIsDeletedFalse(InvoiceStatus status, UUID companyId,
                     Pageable pageable);

       // Replaced
       // Page<SalesInvoice> findByStatusAndIsDeletedFalse(InvoiceStatus status, Pageable pageable);

       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "customer"})
       Page<SalesInvoice> findByInvoiceCurrencyAndCompanyIdAndIsDeletedFalse(String currency, UUID companyId,
                     Pageable pageable);

       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "customer"})
       Page<SalesInvoice> findByInvoiceDateBetweenAndCompanyIdAndIsDeletedFalse(LocalDate startDate, LocalDate endDate,
                     UUID companyId, Pageable pageable);

    @Query(value = "SELECT s.id, s.invoice_number, s.invoice_date, c.customer_name, c.gstin, s.place_of_supply_state_code, " +
            "COALESCE(SUM(i.taxable_amount),0) as taxable, " +
            "COALESCE(SUM(i.cgst_amount),0) as cgst, " +
            "COALESCE(SUM(i.sgst_amount),0) as sgst, " +
            "COALESCE(SUM(i.igst_amount),0) as igst, " +
            "COALESCE(SUM(i.cess_amount),0) as cess, " +
            "MAX(s.total_amount) as total_amount, MAX(h.code) as hsn_code, MAX(g.igst_rate) as gst_rate " +
            "FROM sales_invoice s " +
            "LEFT JOIN customer c ON s.customer_id = c.id " +
            "LEFT JOIN sales_invoice_item i ON i.sales_invoice_id = s.id AND (i.is_deleted = false OR i.is_deleted IS NULL) " +
            "LEFT JOIN hsn_sac_master h ON i.hsn_sac_id = h.id " +
            "LEFT JOIN gst_slab g ON h.gst_slab_id = g.id " +
            "WHERE s.invoice_date BETWEEN :fromDate AND :toDate " +
            "AND (s.is_deleted = false OR s.is_deleted IS NULL) " +
            "AND s.status IN ('POSTED','APPROVED') " +
            "AND s.company_id = :companyId " +
            "GROUP BY s.id, s.invoice_number, s.invoice_date, c.customer_name, c.gstin, s.place_of_supply_state_code " +
            "ORDER BY s.invoice_date DESC",
            nativeQuery = true)
    Page<Object[]> findGstr1ProjectionByInvoiceDateBetweenAndCompanyId(@Param("fromDate") LocalDate fromDate,
                                                                       @Param("toDate") LocalDate toDate,
                                                                       @Param("companyId") UUID companyId,
                                                                       Pageable pageable);

    @Query(value = "SELECT s.id, s.invoice_number, s.invoice_date, c.customer_name, c.gstin, s.place_of_supply_state_code, " +
            "COALESCE(SUM(i.taxable_amount),0) as taxable, " +
            "COALESCE(SUM(i.cgst_amount),0) as cgst, " +
            "COALESCE(SUM(i.sgst_amount),0) as sgst, " +
            "COALESCE(SUM(i.igst_amount),0) as igst, " +
            "COALESCE(SUM(i.cess_amount),0) as cess, " +
            "MAX(s.total_amount) as total_amount, MAX(h.code) as hsn_code, MAX(g.igst_rate) as gst_rate " +
            "FROM sales_invoice s " +
            "LEFT JOIN customer c ON s.customer_id = c.id " +
            "LEFT JOIN sales_invoice_item i ON i.sales_invoice_id = s.id AND (i.is_deleted = false OR i.is_deleted IS NULL) " +
            "LEFT JOIN hsn_sac_master h ON i.hsn_sac_id = h.id " +
            "LEFT JOIN gst_slab g ON h.gst_slab_id = g.id " +
            "WHERE s.invoice_date BETWEEN :fromDate AND :toDate " +
            "AND (s.is_deleted = false OR s.is_deleted IS NULL) " +
            "AND s.status IN ('POSTED','APPROVED') " +
            "GROUP BY s.id, s.invoice_number, s.invoice_date, c.customer_name, c.gstin, s.place_of_supply_state_code " +
            "ORDER BY s.invoice_date DESC",
            nativeQuery = true)
    Page<Object[]> findGstr1ProjectionByInvoiceDateBetween(@Param("fromDate") LocalDate fromDate,
                                                             @Param("toDate") LocalDate toDate,
                                                             Pageable pageable);

       // ============================================================
       // OUTSTANDING & PAYMENT TRACKING
       // ============================================================

       @Query("SELECT i FROM SalesInvoice i WHERE i.company.id = :companyId " +
                     "AND i.status IN (com.erp.account.enums.InvoiceStatus.POSTED, " +
                     "com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID, " +
                     "com.erp.account.enums.InvoiceStatus.APPROVED) " +
                     "AND i.outstandingAmount > 0 AND i.isDeleted = false")
       Page<SalesInvoice> findOutstandingInvoices(@Param("companyId") UUID companyId, Pageable pageable);

       @Query("SELECT i FROM SalesInvoice i WHERE i.company.id = :companyId " +
                     "AND i.dueDate < :asOfDate " +
                     "AND i.status IN (com.erp.account.enums.InvoiceStatus.POSTED, " +
                     "com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID) " +
                     "AND i.outstandingAmount > 0 AND i.isDeleted = false")
       Page<SalesInvoice> findOverdueInvoices(@Param("companyId") UUID companyId, @Param("asOfDate") LocalDate asOfDate,
                     Pageable pageable);

       @Query("SELECT i FROM SalesInvoice i WHERE i.company.id = :companyId " +
                     "AND i.status IN (com.erp.account.enums.InvoiceStatus.POSTED, " +
                     "com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID, " +
                     "com.erp.account.enums.InvoiceStatus.APPROVED) " +
                     "AND i.outstandingAmount > 0 AND i.isDeleted = false")
       List<SalesInvoice> findOutstandingByCompany(@Param("companyId") UUID companyId);

       @Query("SELECT i FROM SalesInvoice i WHERE i.company.id = :companyId AND i.customer.id = :customerId " +
                     "AND i.status IN (com.erp.account.enums.InvoiceStatus.POSTED, " +
                     "com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID, " +
                     "com.erp.account.enums.InvoiceStatus.APPROVED) " +
                     "AND i.outstandingAmount > 0 AND i.isDeleted = false")
       List<SalesInvoice> findOutstandingByCustomerAndCompany(@Param("customerId") UUID customerId,
                     @Param("companyId") UUID companyId);

       // ============================================================
       // DATE-BASED QUERIES
       // ============================================================

       @Query("SELECT i FROM SalesInvoice i WHERE i.company.id = :companyId " +
                     "AND i.invoiceDate >= :startDate AND i.invoiceDate <= :endDate " +
                     "AND i.isDeleted = false ORDER BY i.invoiceDate DESC")
       List<SalesInvoice> findByDateRangeAndCompany(@Param("companyId") UUID companyId,
                     @Param("startDate") LocalDate startDate,
                     @Param("endDate") LocalDate endDate);

       Page<SalesInvoice> findByInvoiceDateBetweenAndIsDeletedFalse(LocalDate startDate, LocalDate endDate, Pageable pageable);

       List<SalesInvoice> findByInvoiceDateBetweenAndIsDeletedFalse(LocalDate startDate, LocalDate endDate);

       @Query("SELECT i FROM SalesInvoice i WHERE i.company.id = :companyId " +
                     "AND i.dueDate <= :targetDate AND i.outstandingAmount > 0 " +
                     "AND i.isDeleted = false ORDER BY i.dueDate ASC")
       List<SalesInvoice> findUpcomingDueInvoices(@Param("companyId") UUID companyId,
                     @Param("targetDate") LocalDate targetDate);

       // ============================================================
       // STATUS-BASED QUERIES
       // ============================================================

       @Query("SELECT COUNT(i) FROM SalesInvoice i WHERE i.company.id = :companyId " +
                     "AND i.status = :status AND i.isDeleted = false")
       long countByStatusAndCompany(@Param("companyId") UUID companyId, @Param("status") InvoiceStatus status);

       @Query("SELECT i FROM SalesInvoice i WHERE i.company.id = :companyId " +
                     "AND i.status IN (com.erp.account.enums.InvoiceStatus.DRAFT, " +
                     "com.erp.account.enums.InvoiceStatus.PENDING_APPROVAL) " +
                     "AND i.isDeleted = false ORDER BY i.createdAt DESC")
       Page<SalesInvoice> findPendingInvoices(@Param("companyId") UUID companyId, Pageable pageable);

       // ============================================================
       // AMOUNT-BASED QUERIES
       // ============================================================

       @Query("SELECT i FROM SalesInvoice i WHERE i.company.id = :companyId " +
                     "AND i.outstandingAmount >= :minAmount AND i.outstandingAmount <= :maxAmount " +
                     "AND i.isDeleted = false ORDER BY i.outstandingAmount DESC")
       Page<SalesInvoice> findByOutstandingAmountRange(@Param("companyId") UUID companyId,
                     @Param("minAmount") BigDecimal minAmount,
                     @Param("maxAmount") BigDecimal maxAmount,
                     Pageable pageable);

       @Query("SELECT i FROM SalesInvoice i WHERE i.company.id = :companyId " +
                     "AND i.totalAmount >= :minAmount AND i.totalAmount <= :maxAmount " +
                     "AND i.isDeleted = false ORDER BY i.totalAmount DESC")
       Page<SalesInvoice> findByTotalAmountRange(@Param("companyId") UUID companyId,
                     @Param("minAmount") BigDecimal minAmount,
                     @Param("maxAmount") BigDecimal maxAmount,
                     Pageable pageable);

       // ============================================================
       // AGGREGATION QUERIES FOR SUMMARY AND AGING
       // ============================================================

       @Query("SELECT SUM(i.outstandingAmount) FROM SalesInvoice i WHERE i.company.id = :companyId " +
              "AND i.status IN (com.erp.account.enums.InvoiceStatus.POSTED, " +
              "com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID) " +
              "AND i.outstandingAmount > 0 AND i.isDeleted = false " +
              "AND i.dueDate >= :startDate AND i.dueDate <= :endDate")
       BigDecimal sumOutstandingByCompanyAndDateRange(@Param("companyId") UUID companyId, 
              @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

       @Query("SELECT SUM(i.outstandingAmount) FROM SalesInvoice i WHERE i.company.id = :companyId " +
              "AND i.status IN (com.erp.account.enums.InvoiceStatus.POSTED, " +
              "com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID) " +
              "AND i.outstandingAmount > 0 AND i.isDeleted = false " +
              "AND i.dueDate < :asOfDate")
       BigDecimal sumOutstandingOverdueByCompany(@Param("companyId") UUID companyId, 
              @Param("asOfDate") LocalDate asOfDate);

       @Query("SELECT SUM(i.totalAmount) FROM SalesInvoice i WHERE i.company.id = :companyId AND i.isDeleted = false")
       BigDecimal sumTotalAmountByCompany(@Param("companyId") UUID companyId);

       @Query("SELECT SUM(i.outstandingAmount) FROM SalesInvoice i WHERE i.company.id = :companyId AND i.isDeleted = false")
       BigDecimal sumOutstandingAmountByCompany(@Param("companyId") UUID companyId);

       @Query("SELECT SUM(i.receivedAmount) FROM SalesInvoice i WHERE i.company.id = :companyId AND i.isDeleted = false")
       BigDecimal sumReceivedAmountByCompany(@Param("companyId") UUID companyId);

       @Query("SELECT SUM(i.outstandingAmount) FROM SalesInvoice i WHERE i.company.id = :companyId " +
              "AND i.dueDate < :asOfDate AND i.outstandingAmount > 0 AND i.isDeleted = false")
       BigDecimal sumOverdueAmountByCompany(@Param("companyId") UUID companyId, @Param("asOfDate") LocalDate asOfDate);

       @Query("SELECT SUM(i.totalAmount) FROM SalesInvoice i WHERE i.company.id = :companyId " +
              "AND i.customer.id = :customerId AND i.isDeleted = false")
       BigDecimal sumTotalAmountByCustomerAndCompany(@Param("customerId") UUID customerId, @Param("companyId") UUID companyId);

       @Query("SELECT SUM(i.receivedAmount) FROM SalesInvoice i WHERE i.company.id = :companyId " +
              "AND i.customer.id = :customerId AND i.isDeleted = false")
       BigDecimal sumReceivedAmountByCustomerAndCompany(@Param("customerId") UUID customerId, @Param("companyId") UUID companyId);

       @Query("SELECT SUM(i.outstandingAmount) FROM SalesInvoice i WHERE i.company.id = :companyId " +
              "AND i.customer.id = :customerId AND i.dueDate < :asOfDate " +
              "AND i.outstandingAmount > 0 AND i.isDeleted = false")
       BigDecimal sumOverdueAmountByCustomerAndCompany(@Param("customerId") UUID customerId,
              @Param("companyId") UUID companyId, @Param("asOfDate") LocalDate asOfDate);

       @Query("SELECT COUNT(i) FROM SalesInvoice i WHERE i.company.id = :companyId AND i.isDeleted = false")
       long countTotalInvoicesByCompany(@Param("companyId") UUID companyId);

       // ============================================================
       // GL POSTING QUERIES
       // ============================================================

       @Query("""
                     SELECT i FROM SalesInvoice i
                     WHERE i.company.id = :companyId
                     AND i.glPostingStatus = :postingStatus
                     AND i.status = :invoiceStatus
                     AND i.isDeleted = false
                     ORDER BY i.invoiceDate ASC
                     """)
       Page<SalesInvoice> findPendingGlPosting(
                     @Param("companyId") UUID companyId,
                     @Param("postingStatus") PostingStatus postingStatus,
                     @Param("invoiceStatus") InvoiceStatus invoiceStatus,
                     Pageable pageable);

       // ============================================================
       // CUSTOMER-RELATED QUERIES
       // ============================================================

       @Query("SELECT SUM(i.outstandingAmount) FROM SalesInvoice i " +
                     "WHERE i.company.id = :companyId AND i.customer.id = :customerId " +
                     "AND i.status IN (com.erp.account.enums.InvoiceStatus.POSTED, " +
                     "com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID) " +
                     "AND i.isDeleted = false")
       BigDecimal sumOutstandingByCustomerAndCompany(@Param("customerId") UUID customerId,
                     @Param("companyId") UUID companyId);

       @Query("SELECT COUNT(i) FROM SalesInvoice i WHERE i.company.id = :companyId " +
                     "AND i.customer.id = :customerId AND i.isDeleted = false")
       long countByCustomerAndCompany(@Param("customerId") UUID customerId, @Param("companyId") UUID companyId);

    @Query("SELECT COUNT(i) FROM SalesInvoice i WHERE i.company.id = :companyId " +
           "AND i.customer.id = :customerId AND i.isDeleted = false AND i.totalAmount > 0 " +
           "AND (i.status = com.erp.account.enums.InvoiceStatus.PAID OR i.outstandingAmount <= 0 OR i.receivedAmount >= i.totalAmount)")
    long countFullyPaidInvoicesByCustomer(@Param("companyId") UUID companyId, @Param("customerId") UUID customerId);

       // ============================================================
       // CURRENCY QUERIES
       // ============================================================

       @Query("SELECT DISTINCT i.invoiceCurrency FROM SalesInvoice i " +
                     "WHERE i.company.id = :companyId AND i.invoiceCurrency IS NOT NULL " +
                     "AND i.isDeleted = false")
       List<String> findDistinctCurrenciesByCompany(@Param("companyId") UUID companyId);
}
