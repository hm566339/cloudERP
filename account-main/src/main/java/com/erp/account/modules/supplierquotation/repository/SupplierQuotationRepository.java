package com.erp.account.modules.supplierquotation.repository;

import com.erp.account.modules.supplierquotation.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
import jakarta.persistence.LockModeType;

public interface SupplierQuotationRepository
        extends JpaRepository<SupplierQuotation, UUID>, JpaSpecificationExecutor<SupplierQuotation> {
    @EntityGraph(attributePaths = { "items", "rfq", "vendor" })
    Optional<SupplierQuotation> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select q from SupplierQuotation q where q.id=:id and q.companyId=:companyId and q.isDeleted=false")
    Optional<SupplierQuotation> findForUpdate(@Param("id") UUID id, @Param("companyId") UUID companyId);

    boolean existsByRfqIdAndVendorIdAndIsDeletedFalse(UUID rfqId, UUID vendorId);

    @EntityGraph(attributePaths = { "vendor", "items", "rfq" })
    List<SupplierQuotation> findByRfqIdAndCompanyIdAndIsDeletedFalse(UUID rfqId, UUID companyId);

    @EntityGraph(attributePaths = { "vendor", "rfq" })
    Page<SupplierQuotation> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = { "vendor", "rfq" })
    Page<SupplierQuotation> findAll(Pageable pageable);
}
