package com.erp.account.modules.creditnote.repository;

import com.erp.account.modules.creditnote.entity.CreditNote;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CreditNoteRepository extends JpaRepository<CreditNote, UUID>, JpaSpecificationExecutor<CreditNote> {
    Optional<CreditNote> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
    Optional<CreditNote> findByIdAndIsDeletedFalse(UUID id);
    Page<CreditNote> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
    List<CreditNote> findAllBySalesInvoiceId(UUID salesInvoiceId);
    List<CreditNote> findAllByCompanyIdAndSalesInvoiceCustomerIdAndIsDeletedFalse(UUID companyId, UUID customerId);
    boolean existsByCompanyIdAndCreditNoteNoAndIsDeletedFalse(UUID companyId, String creditNoteNo);
    boolean existsByCompanyIdAndCreditNoteNoAndIdNotAndIsDeletedFalse(UUID companyId, String creditNoteNo, UUID id);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM CreditNote c " +
           "JOIN FETCH c.company com " +
           "JOIN FETCH c.salesInvoice inv " +
           "JOIN FETCH inv.customer cust " +
           "LEFT JOIN FETCH inv.salesInvoiceItems " +
           "WHERE c.id = :id AND c.isDeleted = false")
    Optional<CreditNote> findProfileById(@org.springframework.data.repository.query.Param("id") UUID id);
}
