package com.erp.account.modules.vendor.repository;

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

import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.appayment.entity.ApPayment;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, UUID>, JpaSpecificationExecutor<Vendor> {
    List<Vendor> findByCompanyId(UUID companyId);

    Page<Vendor> findByCompanyId(UUID companyId, Pageable pageable);

    Optional<Vendor> findByVendorCodeAndCompanyId(String vendorCode, UUID companyId);

    boolean existsByGstinAndCompanyId(String gstin, UUID companyId);

    boolean existsByGstinAndCompanyIdAndIsDeletedFalse(String gstin, UUID companyId);

    Page<Vendor> findByVendorNameContainingIgnoreCaseAndCompanyId(String vendorName, UUID companyId, Pageable pageable);

    Optional<Vendor> findByGstinAndCompanyId(String gstin, UUID companyId);

    Optional<Vendor> findByPanNoAndCompanyId(String panNo, UUID companyId);

    Optional<Vendor> findByGstinAndCompanyIdAndIsDeletedFalse(String gstin, UUID companyId);

    Optional<Vendor> findByPanNoAndCompanyIdAndIsDeletedFalse(String panNo, UUID companyId);

    Page<Vendor> findByCompanyIdAndIsActiveTrue(UUID companyId, Pageable pageable);

    List<Vendor> findByCompanyIdAndIsDeletedFalse(UUID companyId);

    @Query("SELECT COALESCE(SUM(inv.outstandingAmount), 0) FROM ApInvoice inv WHERE inv.company.id = :companyId AND inv.vendor.id = :vendorId AND inv.isDeleted = false")
    BigDecimal getOutstandingBalance(@Param("vendorId") UUID vendorId, @Param("companyId") UUID companyId);

    @Query("SELECT COUNT(inv) FROM ApInvoice inv WHERE inv.company.id = :companyId AND inv.vendor.id = :vendorId AND inv.isDeleted = false")
    long countActiveInvoicesByVendor(@Param("vendorId") UUID vendorId, @Param("companyId") UUID companyId);

    @Query("SELECT COUNT(pmt) FROM ApPayment pmt WHERE pmt.company.id = :companyId AND pmt.vendor.id = :vendorId AND pmt.isDeleted = false")
    long countActivePaymentsByVendor(@Param("vendorId") UUID vendorId, @Param("companyId") UUID companyId);

    @Query("SELECT v FROM Vendor v WHERE v.company.id = :companyId AND v.isActive = true AND v.isDeleted = false")
    List<Vendor> findActiveVendors(@Param("companyId") UUID companyId);

    @Query("SELECT v FROM Vendor v WHERE v.id = :vendorId AND v.isDeleted = false")
    Optional<Vendor> findByIdAndNotDeleted(@Param("vendorId") UUID vendorId);

    @Query("SELECT v FROM Vendor v WHERE v.id = :vendorId AND v.company.id = :companyId AND v.isDeleted = false")
    Optional<Vendor> findByIdAndCompanyIdAndNotDeleted(@Param("vendorId") UUID vendorId,
            @Param("companyId") UUID companyId);

    @Query("SELECT COALESCE(SUM(inv.totalAmount), 0) FROM ApInvoice inv WHERE inv.company.id = :companyId AND inv.vendor.id = :vendorId AND inv.invoiceDate BETWEEN :startDate AND :endDate AND inv.isDeleted = false")
    BigDecimal getTotalInvoiceAmountForPeriod(@Param("vendorId") UUID vendorId, @Param("companyId") UUID companyId,
            @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(pmt.paymentAmount), 0) FROM ApPayment pmt WHERE pmt.company.id = :companyId AND pmt.vendor.id = :vendorId AND pmt.paymentDate BETWEEN :startDate AND :endDate AND pmt.isDeleted = false")
    BigDecimal getTotalPaymentAmountForPeriod(@Param("vendorId") UUID vendorId, @Param("companyId") UUID companyId,
            @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    boolean existsByVendorCode(String vendorCode);
}
