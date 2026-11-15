package com.erp.crm.modules.lead.repository;

import com.erp.crm.modules.lead.entity.CrmLead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmLeadRepository extends JpaRepository<CrmLead, UUID>, JpaSpecificationExecutor<CrmLead> {

    Optional<CrmLead> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);

    Optional<CrmLead> findByCompanyIdAndLeadCodeAndIsDeletedFalse(UUID companyId, String leadCode);

    Optional<CrmLead> findByCompanyIdAndNormalizedPhoneAndIsDeletedFalse(UUID companyId, String normalizedPhone);

    Optional<CrmLead> findByCompanyIdAndNormalizedEmailAndIsDeletedFalse(UUID companyId, String normalizedEmail);

    Page<CrmLead> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    @Query("SELECT COUNT(l) FROM CrmLead l WHERE l.companyId = :companyId AND l.isDeleted = false")
    long countActiveLeads(@Param("companyId") UUID companyId);

    @Query("SELECT COUNT(l) FROM CrmLead l WHERE l.companyId = :companyId AND l.isConverted = true AND l.isDeleted = false")
    long countConvertedLeads(@Param("companyId") UUID companyId);

    @Query("SELECT COUNT(l) FROM CrmLead l WHERE l.companyId = :companyId AND l.isLost = true AND l.isDeleted = false")
    long countLostLeads(@Param("companyId") UUID companyId);
}

