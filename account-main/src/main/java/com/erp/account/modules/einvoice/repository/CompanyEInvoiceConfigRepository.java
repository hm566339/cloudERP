package com.erp.account.modules.einvoice.repository;

import com.erp.account.modules.einvoice.entity.CompanyEInvoiceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyEInvoiceConfigRepository extends JpaRepository<CompanyEInvoiceConfig, UUID> {
    Optional<CompanyEInvoiceConfig> findByCompanyIdAndGstRegistrationIdAndIsActiveTrue(UUID companyId, UUID gstRegistrationId);
    List<CompanyEInvoiceConfig> findByCompanyIdAndIsActiveTrue(UUID companyId);
    Optional<CompanyEInvoiceConfig> findByCompanyIdAndGstRegistrationId(UUID companyId, UUID gstRegistrationId);
}
