package com.erp.account.modules.paymentvoucher.repository;

import com.erp.account.enums.PaymentStatus;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentVoucherRepository extends JpaRepository<PaymentVoucher, UUID>, JpaSpecificationExecutor<PaymentVoucher> {
    Optional<PaymentVoucher> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
    Optional<PaymentVoucher> findByVoucherNoAndCompanyIdAndIsDeletedFalse(String voucherNo, UUID companyId);
    @Query("SELECT DISTINCT pv FROM PaymentVoucher pv " +
           "LEFT JOIN FETCH pv.company " +
           "LEFT JOIN FETCH pv.vendor " +
           "LEFT JOIN FETCH pv.bankAccount " +
           "LEFT JOIN FETCH pv.purchaseOrder " +
           "LEFT JOIN FETCH pv.allocations alloc " +
           "LEFT JOIN FETCH alloc.apInvoice " +
           "LEFT JOIN FETCH alloc.purchaseOrder " +
           "WHERE pv.id = :id AND pv.isDeleted = false")
    Optional<PaymentVoucher> findProfileById(@org.springframework.data.repository.query.Param("id") UUID id);
    
    Optional<PaymentVoucher> findFirstByCompanyIdAndVoucherNoStartingWithOrderByVoucherNoDesc(UUID companyId, String prefix);
    boolean existsByCompanyIdAndVoucherNoAndIsDeletedFalse(UUID companyId, String voucherNo);
    boolean existsByBankAccountIdAndIsDeletedFalse(UUID bankAccountId);
    Page<PaymentVoucher> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
    Page<PaymentVoucher> findByCompanyIdAndVendorIdAndIsDeletedFalse(UUID companyId, UUID vendorId, Pageable pageable);
    Page<PaymentVoucher> findByCompanyIdAndPaymentStatusInAndIsDeletedFalse(UUID companyId, List<PaymentStatus> statuses, Pageable pageable);
    List<PaymentVoucher> findByVoucherDateBetween(LocalDate startDate, LocalDate endDate);
}
