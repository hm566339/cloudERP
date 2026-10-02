package com.erp.account.modules.debitnote.repository;

import com.erp.account.modules.debitnote.entity.DebitNote;
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
public interface DebitNoteRepository extends JpaRepository<DebitNote, UUID>, JpaSpecificationExecutor<DebitNote> {
    Optional<DebitNote> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
    Page<DebitNote> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
    List<DebitNote> findAllByApInvoiceId(UUID apInvoiceId);
    List<DebitNote> findAllByCompanyIdAndApInvoiceVendorIdAndIsDeletedFalse(UUID companyId, UUID vendorId);
    boolean existsByCompanyIdAndDebitNoteNoAndIsDeletedFalse(UUID companyId, String debitNoteNo);

    @Query("SELECT d FROM DebitNote d " +
           "JOIN FETCH d.company " +
           "JOIN FETCH d.apInvoice i " +
           "JOIN FETCH i.vendor " +
           "WHERE d.id = :id AND (d.isDeleted = false OR d.isDeleted IS NULL)")
    Optional<DebitNote> findProfileById(@Param("id") UUID id);
}
