package com.erp.account.modules.receiptvoucher.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface ReceiptVoucherRepository extends JpaRepository<ReceiptVoucher, UUID>, JpaSpecificationExecutor<ReceiptVoucher> {
    List<ReceiptVoucher> findByReceiptDateBetween(LocalDate startDate, LocalDate endDate);
    Optional<ReceiptVoucher> findByCompanyIdAndReceiptNo(UUID companyId, String receiptNo);
    Optional<ReceiptVoucher> findByIdAndCompanyId(UUID id, UUID companyId);
    Optional<ReceiptVoucher> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
    Optional<ReceiptVoucher> findByIdAndIsDeletedFalse(UUID id);
    boolean existsByCompanyIdAndReceiptNoAndIsDeletedFalse(UUID companyId, String receiptNo);
    Page<ReceiptVoucher> findByCustomerIdAndCompanyIdAndIsDeletedFalse(UUID customerId, UUID companyId, Pageable pageable);
    List<ReceiptVoucher> findByReferenceNoAndCompanyIdAndIsDeletedFalse(String referenceNo, UUID companyId);

    @EntityGraph(attributePaths = {
        "company", 
        "customer", 
        "bankAccount", 
        "receiptAccount", 
        "receivableAccount", 
        "allocations", 
        "allocations.salesInvoice"
    })
    Optional<ReceiptVoucher> findProfileByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
    
    @EntityGraph(attributePaths = {
        "company", 
        "customer", 
        "bankAccount", 
        "receiptAccount", 
        "receivableAccount", 
        "allocations", 
        "allocations.salesInvoice"
    })
    Optional<ReceiptVoucher> findProfileByIdAndIsDeletedFalse(UUID id);
}

