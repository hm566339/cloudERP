package com.erp.account.modules.apinvoice.repository;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface ApInvoiceRepository extends JpaRepository<ApInvoice, UUID>, JpaSpecificationExecutor<ApInvoice> {
    
    // ============================================================
    // BASIC QUERIES
    // ============================================================
    
    Optional<ApInvoice> findByInvoiceNoAndCompanyId(String invoiceNo, UUID companyId);

    Optional<ApInvoice> findByInvoiceNoAndCompanyIdAndIsDeletedFalse(String invoiceNo, UUID companyId);

    Optional<ApInvoice> findByVendorIdAndInvoiceNoAndCompanyId(UUID vendorId, String invoiceNo, UUID companyId);

    Optional<ApInvoice> findByInvoiceNoAndVendorIdAndCompanyIdAndIsDeletedFalse(String invoiceNo, UUID vendorId, UUID companyId);
    
    List<ApInvoice> findAllByVendorId(UUID vendorId);
    
    Optional<ApInvoice> findByIdAndIsDeletedFalse(UUID id);
    
    Optional<ApInvoice> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

       @Lock(LockModeType.PESSIMISTIC_WRITE)
       @Query("select i from ApInvoice i where i.id = :id and i.company.id = :companyId and i.isDeleted = false")
       Optional<ApInvoice> findByIdAndCompanyIdAndIsDeletedFalseForUpdate(@Param("id") UUID id,
                                                                                                                               @Param("companyId") UUID companyId);

    List<ApInvoice> findByGoodsReceiptIdAndIsDeletedFalse(UUID goodsReceiptId);

       List<ApInvoice> findByGoodsReceiptIdAndCompanyIdAndIsDeletedFalse(UUID goodsReceiptId, UUID companyId);

    Page<ApInvoice> findAllByCompanyIdAndStatus(UUID companyId, InvoiceStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"items", "allocations"})
    Optional<ApInvoice> findWithItemsAndPaymentsById(UUID id);
    
    // ============================================================
    // VENDOR QUERIES
    // ============================================================
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId AND i.vendor.id = :vendorId")
    Page<ApInvoice> findByVendor(@Param("companyId") UUID companyId, 
                                 @Param("vendorId") UUID vendorId, 
                                 Pageable pageable);
    
    @Query("SELECT COUNT(i) FROM ApInvoice i WHERE i.vendor.id = :vendorId AND i.status = :status")
    long countByVendorAndStatus(@Param("vendorId") UUID vendorId, @Param("status") InvoiceStatus status);
    
    // ============================================================
    // PAYMENT STATUS QUERIES
    // ============================================================
    

    
    // ============================================================
    // OVERDUE QUERIES
    // ============================================================
    

    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.dueDate < :asOfDate AND i.outstandingAmount > 0 AND i.status IN ('POSTED', 'PARTIALLY_PAID')")
    List<ApInvoice> findAllOverdueInvoices(@Param("companyId") UUID companyId, 
                                           @Param("asOfDate") LocalDate asOfDate);
    
    // ============================================================
    // DATE RANGE QUERIES
    // ============================================================
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.invoiceDate BETWEEN :startDate AND :endDate ORDER BY i.invoiceDate DESC")
    Page<ApInvoice> findInvoicesByDateRange(@Param("companyId") UUID companyId,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate,
                                           Pageable pageable);

    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.invoiceDate BETWEEN :startDate AND :endDate AND i.isDeleted = false ORDER BY i.invoiceDate DESC")
    List<ApInvoice> findByCompanyIdAndInvoiceDateBetween(@Param("companyId") UUID companyId,
                                                          @Param("startDate") LocalDate startDate,
                                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT i FROM ApInvoice i WHERE i.invoiceDate BETWEEN :startDate AND :endDate AND i.isDeleted = false ORDER BY i.invoiceDate DESC")
    List<ApInvoice> findByInvoiceDateBetweenAndIsDeletedFalse(@Param("startDate") LocalDate startDate,
                                                              @Param("endDate") LocalDate endDate);
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.invoiceDate BETWEEN :startDate AND :endDate AND i.vendor.id = :vendorId")
    List<ApInvoice> findVendorInvoicesByDateRange(@Param("companyId") UUID companyId,
                                                  @Param("vendorId") UUID vendorId,
                                                  @Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate);
    
    // ============================================================
    // AMOUNT FILTER QUERIES
    // ============================================================
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.totalAmount BETWEEN :minAmount AND :maxAmount")
    Page<ApInvoice> findInvoicesByAmountRange(@Param("companyId") UUID companyId,
                                             @Param("minAmount") BigDecimal minAmount,
                                             @Param("maxAmount") BigDecimal maxAmount,
                                             Pageable pageable);
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.outstandingAmount BETWEEN :minAmount AND :maxAmount")
    Page<ApInvoice> findInvoicesByOutstandingRange(@Param("companyId") UUID companyId,
                                                  @Param("minAmount") BigDecimal minAmount,
                                                  @Param("maxAmount") BigDecimal maxAmount,
                                                  Pageable pageable);
    
    // ============================================================
    // STATUS QUERIES
    // ============================================================
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId AND i.status = :status")
    Page<ApInvoice> findByStatus(@Param("companyId") UUID companyId,
                                @Param("status") InvoiceStatus status,
                                Pageable pageable);
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.status IN ('DRAFT', 'PENDING_APPROVAL')")
    Page<ApInvoice> findDraftAndPendingInvoices(@Param("companyId") UUID companyId, Pageable pageable);
    
    // ============================================================
    // APPROVAL QUERIES
    // ============================================================
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.status = 'PENDING_APPROVAL' ORDER BY i.createdAt ASC")
    Page<ApInvoice> findPendingApprovalInvoices(@Param("companyId") UUID companyId, Pageable pageable);
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.approvedBy = :approverId ORDER BY i.approvedAt DESC")
    Page<ApInvoice> findApprovedByUser(@Param("companyId") UUID companyId,
                                      @Param("approverId") UUID approverId,
                                      Pageable pageable);
    
    // ============================================================
    // CURRENCY QUERIES
    // ============================================================
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.invoiceCurrency = :currency")
    Page<ApInvoice> findByCurrency(@Param("companyId") UUID companyId,
                                  @Param("currency") String currency,
                                  Pageable pageable);
    
    // ============================================================
    // SEARCH & AGGREGATE QUERIES
    // ============================================================
    

    
    @Query("SELECT COALESCE(SUM(i.outstandingAmount), 0) FROM ApInvoice i " +
           "WHERE i.vendor.id = :vendorId AND i.status IN ('POSTED', 'PARTIALLY_PAID')")
    BigDecimal getVendorOutstandingBalance(@Param("vendorId") UUID vendorId);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM ApInvoice i " +
           "WHERE i.vendor.id = :vendorId AND i.status IN ('POSTED', 'PARTIALLY_PAID', 'PAID')")
    BigDecimal getVendorTotalPurchaseAmount(@Param("vendorId") UUID vendorId);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM ApInvoice i " +
           "WHERE i.company.id = :companyId AND i.isDeleted = false AND i.status = 'POSTED'")
    BigDecimal getTotalPostedAmount(@Param("companyId") UUID companyId);

    @Query("SELECT COALESCE(SUM(i.paidAmount), 0) FROM ApInvoice i " +
           "WHERE i.company.id = :companyId AND i.isDeleted = false AND i.status = 'PAID'")
    BigDecimal getTotalPaidAmount(@Param("companyId") UUID companyId);
    
    @Query("SELECT COALESCE(SUM(i.outstandingAmount), 0) FROM ApInvoice i " +
           "WHERE i.company.id = :companyId AND i.isDeleted = false AND i.status IN ('POSTED', 'PARTIALLY_PAID')")
    BigDecimal getTotalOutstandingAmount(@Param("companyId") UUID companyId);
    

    
    // ============================================================
    // VENDOR TRANSACTION HISTORY
    // ============================================================
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId AND i.vendor.id = :vendorId " +
           "AND i.invoiceDate BETWEEN :startDate AND :endDate " +
           "ORDER BY i.invoiceDate DESC")
    Page<ApInvoice> getVendorTransactionHistory(@Param("companyId") UUID companyId,
                                               @Param("vendorId") UUID vendorId,
                                               @Param("startDate") LocalDate startDate,
                                               @Param("endDate") LocalDate endDate,
                                               Pageable pageable);
    
    // ============================================================
    // AGING ANALYSIS QUERIES
    // ============================================================
    
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId " +
           "AND i.isDeleted = false AND i.status IN ('POSTED', 'PARTIALLY_PAID') " +
           "AND i.dueDate BETWEEN :startDate AND :endDate")
    Page<ApInvoice> getInvoicesByAgingBucket(@Param("companyId") UUID companyId,
                                            @Param("startDate") LocalDate startDate,
                                            @Param("endDate") LocalDate endDate,
                                            Pageable pageable);
    @Query("SELECT i FROM ApInvoice i WHERE i.company.id = :companyId AND i.status IN ('POSTED', 'PARTIALLY_PAID') " +
           "AND i.outstandingAmount > 0 ORDER BY i.dueDate ASC")
    Page<ApInvoice> findOutstandingInvoices(@Param("companyId") UUID companyId, Pageable pageable);
}

