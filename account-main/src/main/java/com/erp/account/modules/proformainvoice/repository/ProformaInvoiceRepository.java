package com.erp.account.modules.proformainvoice.repository;

import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProformaInvoiceRepository extends JpaRepository<ProformaInvoice, UUID>, JpaSpecificationExecutor<ProformaInvoice> {

    Optional<ProformaInvoice> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @EntityGraph(attributePaths = {"items", "customer"})
    Optional<ProformaInvoice> findWithItemsByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    Optional<ProformaInvoice> findByPiNumberAndCompanyIdAndIsDeletedFalse(String piNumber, UUID companyId);

    boolean existsByPiNumberAndCompanyIdAndIsDeletedFalse(String piNumber, UUID companyId);

    boolean existsByPiNumberAndCompanyIdAndIdNotAndIsDeletedFalse(String piNumber, UUID companyId, UUID id);

    boolean existsBySourceQuotationIdAndCompanyIdAndIsDeletedFalse(UUID quotationId, UUID companyId);

    Page<ProformaInvoice> findAll(Specification<ProformaInvoice> spec, Pageable pageable);

    java.util.List<ProformaInvoice> findBySourceQuotationIdAndCompanyId(UUID sourceQuotationId, UUID companyId);
}
