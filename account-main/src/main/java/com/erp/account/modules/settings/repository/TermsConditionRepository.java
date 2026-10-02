package com.erp.account.modules.settings.repository;

import com.erp.account.modules.settings.entity.TermsCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TermsConditionRepository extends JpaRepository<TermsCondition, UUID>, JpaSpecificationExecutor<TermsCondition> {

    List<TermsCondition> findByCompanyIdAndIsDeletedFalse(UUID companyId);
    List<TermsCondition> findByCompanyIdAndDocumentTypeAndIsDeletedFalse(UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType);

    List<TermsCondition> findByCompanyIdAndIsActiveTrueAndIsDeletedFalse(UUID companyId);
    List<TermsCondition> findByCompanyIdAndDocumentTypeAndIsActiveTrueAndIsDeletedFalse(UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType);

    Optional<TermsCondition> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
    Optional<TermsCondition> findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(UUID id, UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType);

    Optional<TermsCondition> findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(UUID companyId);
    Optional<TermsCondition> findByCompanyIdAndDocumentTypeAndIsDefaultTrueAndIsDeletedFalse(UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType);
}

