package com.erp.account.modules.quotation.repository;

import com.erp.account.modules.quotation.entity.Quotation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, UUID>, JpaSpecificationExecutor<Quotation> {

    @EntityGraph(attributePaths = {"company", "customer", "quotationItems", "quotationItems.hsnSacMaster", "quotationItems.hsnSacMaster.gstSlab"})
    Optional<Quotation> findById(UUID id);

    @EntityGraph(attributePaths = {"company", "customer", "quotationItems", "quotationItems.hsnSacMaster", "quotationItems.hsnSacMaster.gstSlab"})
    Optional<Quotation> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @EntityGraph(attributePaths = {"company", "customer", "quotationItems", "quotationItems.hsnSacMaster", "quotationItems.hsnSacMaster.gstSlab"})
    Optional<Quotation> findByQuotationNumberAndCompanyIdAndIsDeletedFalse(String quotationNumber, UUID companyId);

    boolean existsByQuotationNumberAndCompanyIdAndIsDeletedFalse(String quotationNumber, UUID companyId);
    boolean existsByQuotationNumberAndCompanyIdAndIdNotAndIsDeletedFalse(String quotationNumber, UUID companyId, UUID id);

    @EntityGraph(attributePaths = {"company", "customer"})
    List<Quotation> findAllByIdInAndCompanyIdAndIsDeletedFalse(Collection<UUID> ids, UUID companyId);
}

