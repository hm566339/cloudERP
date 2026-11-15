package com.erp.crm.modules.quotation.repository;

import com.erp.crm.modules.quotation.entity.CrmQuotationRevision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmQuotationRevisionRepository extends JpaRepository<CrmQuotationRevision, UUID> {
    List<CrmQuotationRevision> findByCompanyIdAndQuotationIdOrderByRevisionNumberDesc(UUID companyId, UUID quotationId);
    Optional<CrmQuotationRevision> findByQuotationIdAndRevisionNumber(UUID quotationId, Integer revisionNumber);
}

