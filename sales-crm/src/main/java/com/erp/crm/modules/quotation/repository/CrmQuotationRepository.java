package com.erp.crm.modules.quotation.repository;

import com.erp.crm.modules.quotation.entity.CrmQuotation;
import com.erp.crm.modules.quotation.enums.QuotationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmQuotationRepository extends JpaRepository<CrmQuotation, UUID>, JpaSpecificationExecutor<CrmQuotation> {

    Optional<CrmQuotation> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);

    Optional<CrmQuotation> findByCompanyIdAndQuotationNumberAndRevisionNumberAndIsDeletedFalse(
            UUID companyId, String quotationNumber, Integer revisionNumber);

    Page<CrmQuotation> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    @Query("SELECT COUNT(q) FROM CrmQuotation q WHERE q.companyId = :companyId AND q.status = :status AND q.isDeleted = false")
    long countByCompanyIdAndStatus(@Param("companyId") UUID companyId, @Param("status") QuotationStatus status);

    @Query("SELECT COALESCE(SUM(q.totalAmount), 0) FROM CrmQuotation q WHERE q.companyId = :companyId AND q.status = :status AND q.isDeleted = false")
    BigDecimal sumTotalAmountByStatus(@Param("companyId") UUID companyId, @Param("status") QuotationStatus status);
}

