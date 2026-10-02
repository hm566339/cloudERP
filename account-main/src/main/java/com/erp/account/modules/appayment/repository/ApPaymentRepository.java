package com.erp.account.modules.appayment.repository;

import com.erp.account.modules.appayment.entity.ApPayment;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ApPaymentRepository extends JpaRepository<ApPayment, UUID>, JpaSpecificationExecutor<ApPayment> {

    Optional<ApPayment> findByPaymentNoAndCompanyIdAndIsDeletedFalse(String paymentNo, UUID companyId);

    boolean existsByCompanyIdAndPaymentNoAndIsDeletedFalse(UUID companyId, String paymentNo);

    Optional<ApPayment> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    Optional<ApPayment> findByIdAndIsDeletedFalse(UUID id);

    Page<ApPayment> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    Page<ApPayment> findByVendorIdAndCompanyIdAndIsDeletedFalse(UUID vendorId, UUID companyId, Pageable pageable);

    @Query("SELECT p FROM ApPayment p JOIN p.allocations a WHERE p.company.id = :companyId " +
           "AND a.apInvoice.id = :invoiceId AND p.isDeleted = false")
    Page<ApPayment> findByInvoiceId(@Param("companyId") UUID companyId,
                                    @Param("invoiceId") UUID invoiceId,
                                    Pageable pageable);

    @Query("SELECT p FROM ApPayment p WHERE p.company.id = :companyId " +
           "AND (LOWER(p.paymentNo) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.referenceNo) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND p.isDeleted = false")
    Page<ApPayment> searchPayments(@Param("companyId") UUID companyId,
                                   @Param("search") String search,
                                   Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.paymentAmount), 0) FROM ApPayment p " +
           "WHERE p.vendor.id = :vendorId AND p.isDeleted = false")
    BigDecimal getTotalVendorPayments(@Param("vendorId") UUID vendorId);

    @Query("SELECT COALESCE(SUM(p.paymentAmount), 0) FROM ApPayment p " +
           "WHERE p.company.id = :companyId AND p.paymentDate BETWEEN :startDate AND :endDate " +
           "AND p.isDeleted = false")
    BigDecimal getTotalPaymentsByCompanyAndDateRange(@Param("companyId") UUID companyId,
                                                     @Param("startDate") LocalDate startDate,
                                                     @Param("endDate") LocalDate endDate);
}
