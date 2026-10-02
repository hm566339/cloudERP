package com.erp.account.modules.apinvoice.repository;

import com.erp.account.modules.apinvoice.entity.ApInvoiceItem;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ApInvoiceItemRepository extends JpaRepository<ApInvoiceItem, UUID> {
    
    // ============================================================
    // BASIC QUERIES
    // ============================================================
    
    List<ApInvoiceItem> findAllByApInvoiceId(UUID apInvoiceId);
    
    // ============================================================
    // AMOUNT AGGREGATE QUERIES
    // ============================================================
    
    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM ApInvoiceItem i WHERE i.apInvoice.id = :invoiceId")
    BigDecimal getInvoiceItemsTotal(@Param("invoiceId") UUID invoiceId);
    
    @Query("SELECT COALESCE(SUM(i.taxableAmount), 0) FROM ApInvoiceItem i WHERE i.apInvoice.id = :invoiceId")
    BigDecimal getInvoiceTaxableAmount(@Param("invoiceId") UUID invoiceId);
    
    @Query("SELECT COALESCE(SUM(i.taxAmount), 0) FROM ApInvoiceItem i WHERE i.apInvoice.id = :invoiceId")
    BigDecimal getInvoiceTaxAmount(@Param("invoiceId") UUID invoiceId);
    
    // ============================================================
    // LINE ITEM QUERIES
    // ============================================================
    
    @Query("SELECT COUNT(i) FROM ApInvoiceItem i WHERE i.apInvoice.id = :invoiceId")
    long countItemsByInvoice(@Param("invoiceId") UUID invoiceId);
    
    @Query("SELECT i FROM ApInvoiceItem i WHERE i.apInvoice.id = :invoiceId AND i.company.id = :companyId")
    List<ApInvoiceItem> findByInvoiceAndCompany(@Param("invoiceId") UUID invoiceId,
                                               @Param("companyId") UUID companyId);
    
    @Query("SELECT i FROM ApInvoiceItem i WHERE i.itemId = :itemId AND i.company.id = :companyId")
    List<ApInvoiceItem> findByItemId(@Param("itemId") UUID itemId, @Param("companyId") UUID companyId);
    
    // ============================================================
    // DELETION QUERIES
    // ============================================================
    
    @Modifying
    @Query("UPDATE ApInvoiceItem i SET i.isDeleted = true, i.deletedBy = :userId, i.deletedByUsername = :username, i.deletedAt = CURRENT_TIMESTAMP WHERE i.apInvoice.id = :invoiceId AND i.company.id = :companyId AND i.isDeleted = false")
    void softDeleteByInvoiceId(@Param("invoiceId") UUID invoiceId, @Param("companyId") UUID companyId, @Param("userId") UUID userId, @Param("username") String username);

    @Query("SELECT i FROM ApInvoiceItem i WHERE i.apInvoice.id = :invoiceId AND i.company.id = :companyId AND i.isDeleted = false")
    List<ApInvoiceItem> findByApInvoiceIdAndCompanyIdAndIsDeletedFalse(@Param("invoiceId") UUID invoiceId,
                                                                       @Param("companyId") UUID companyId);
}

