package com.erp.account.modules.invoicetax.repository;

import com.erp.account.modules.invoicetax.entity.InvoiceTax;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface InvoiceTaxRepository extends JpaRepository<InvoiceTax, UUID>, JpaSpecificationExecutor<InvoiceTax> {
    Optional<InvoiceTax> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
}
