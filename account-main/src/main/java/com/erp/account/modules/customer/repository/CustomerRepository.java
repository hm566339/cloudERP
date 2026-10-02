package com.erp.account.modules.customer.repository;

import com.erp.account.modules.customer.entity.Customer;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID>, JpaSpecificationExecutor<Customer> {

    Optional<Customer> findByCustomerCodeAndCompanyId(String customerCode, UUID companyId);

    Optional<Customer> findByGstinAndCompanyId(String gstin, UUID companyId);

    Optional<Customer> findByPanNoAndCompanyId(String panNo, UUID companyId);

    Optional<Customer> findByEmailAndCompanyId(String email, UUID companyId);

    List<Customer> findByCompanyId(UUID companyId);

    Page<Customer> findByCompanyId(UUID companyId, Pageable pageable);

    Page<Customer> findAllByCompanyIdAndIsActiveTrue(UUID companyId, Pageable pageable);

    Optional<Customer> findByIdAndIsDeletedFalse(UUID customerId);

    Optional<Customer> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    default Page<Customer> findFiltered(Specification<Customer> spec, Pageable pageable) {
        return findAll(spec, pageable);
    }

    @Query("SELECT COALESCE(SUM(inv.outstandingAmount), 0) FROM SalesInvoice inv WHERE inv.customer.id = :customerId AND inv.isDeleted = false")
    BigDecimal getOutstandingAmount(@Param("customerId") UUID customerId);

    @Query("SELECT COUNT(inv) FROM SalesInvoice inv WHERE inv.customer.id = :customerId AND inv.isDeleted = false")
    long countInvoices(@Param("customerId") UUID customerId);

    @Query("SELECT COUNT(rec) FROM ReceiptVoucher rec WHERE rec.customer.id = :customerId AND rec.isDeleted = false")
    long countReceipts(@Param("customerId") UUID customerId);

    @Query("SELECT COALESCE(SUM(inv.totalAmount), 0) FROM SalesInvoice inv WHERE inv.customer.id = :customerId AND inv.invoiceDate BETWEEN :startDate AND :endDate AND inv.isDeleted = false")
    BigDecimal getInvoiceAmountForPeriod(@Param("customerId") UUID customerId, @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(rec.receiptAmount), 0) FROM ReceiptVoucher rec WHERE rec.customer.id = :customerId AND rec.receiptDate BETWEEN :startDate AND :endDate AND rec.isDeleted = false")
    BigDecimal getReceiptAmountForPeriod(@Param("customerId") UUID customerId, @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    boolean existsByCustomerCode(String customerCode);

    boolean existsByCustomerCodeAndCompany_Id(String customerCode, UUID companyId);

}
