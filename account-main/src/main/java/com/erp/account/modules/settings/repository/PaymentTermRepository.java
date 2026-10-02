package com.erp.account.modules.settings.repository;

import com.erp.account.modules.settings.entity.PaymentTerm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTermRepository extends JpaRepository<PaymentTerm, UUID>, JpaSpecificationExecutor<PaymentTerm> {

    List<PaymentTerm> findByCompanyIdAndIsDeletedFalse(UUID companyId);
    List<PaymentTerm> findByCompanyIdAndDocumentTypeAndIsDeletedFalse(UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType);

    List<PaymentTerm> findByCompanyIdAndIsActiveTrueAndIsDeletedFalse(UUID companyId);
    List<PaymentTerm> findByCompanyIdAndDocumentTypeAndIsActiveTrueAndIsDeletedFalse(UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType);

    Optional<PaymentTerm> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
    Optional<PaymentTerm> findByIdAndCompanyIdAndDocumentTypeAndIsDeletedFalse(UUID id, UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType);

    Optional<PaymentTerm> findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(UUID companyId);
    Optional<PaymentTerm> findByCompanyIdAndDocumentTypeAndIsDefaultTrueAndIsDeletedFalse(UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType);
}
