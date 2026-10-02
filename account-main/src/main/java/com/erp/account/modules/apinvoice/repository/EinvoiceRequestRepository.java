package com.erp.account.modules.apinvoice.repository;

import com.erp.account.enums.EinvoiceStatus;
import com.erp.account.modules.apinvoice.entity.EinvoiceRequest;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EinvoiceRequestRepository extends JpaRepository<EinvoiceRequest, UUID> {
    Page<EinvoiceRequest> findAllByStatus(EinvoiceStatus status, Pageable pageable);
    Page<EinvoiceRequest> findAllByCompanyId(UUID companyId, Pageable pageable);
}
