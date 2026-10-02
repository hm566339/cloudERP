package com.erp.account.modules.settings.repository;

import com.erp.account.modules.common.enums.SalesDocumentType;
import com.erp.account.modules.settings.entity.WarrantyTerm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarrantyTermRepository extends JpaRepository<WarrantyTerm, UUID> {

    @Query("SELECT wt FROM WarrantyTerm wt WHERE wt.companyId = :companyId AND wt.isDeleted = false " +
            "AND (:documentType IS NULL OR wt.documentType = :documentType) " +
            "ORDER BY wt.name ASC")
    List<WarrantyTerm> findByCompanyIdAndDocumentTypeAndIsDeletedFalse(@Param("companyId") UUID companyId, @Param("documentType") SalesDocumentType documentType);

    Optional<WarrantyTerm> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @Query("SELECT wt FROM WarrantyTerm wt WHERE wt.companyId = :companyId AND wt.documentType = :documentType AND wt.isDefault = true AND wt.isDeleted = false")
    Optional<WarrantyTerm> findDefaultByCompanyIdAndDocumentType(@Param("companyId") UUID companyId, @Param("documentType") SalesDocumentType documentType);

    @Query("SELECT CASE WHEN COUNT(wt) > 0 THEN true ELSE false END FROM WarrantyTerm wt " +
            "WHERE wt.companyId = :companyId AND wt.name = :name AND wt.documentType = :documentType AND wt.isDeleted = false")
    boolean existsByCompanyIdAndNameAndDocumentTypeAndIsDeletedFalse(@Param("companyId") UUID companyId, @Param("name") String name, @Param("documentType") SalesDocumentType documentType);
}
