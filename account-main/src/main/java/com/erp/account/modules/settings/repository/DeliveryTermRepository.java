package com.erp.account.modules.settings.repository;

import com.erp.account.modules.common.enums.SalesDocumentType;
import com.erp.account.modules.settings.entity.DeliveryTerm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryTermRepository extends JpaRepository<DeliveryTerm, UUID> {

    @Query("SELECT dt FROM DeliveryTerm dt WHERE dt.companyId = :companyId AND dt.isDeleted = false " +
            "AND (:documentType IS NULL OR dt.documentType = :documentType) " +
            "ORDER BY dt.name ASC")
    List<DeliveryTerm> findByCompanyIdAndDocumentTypeAndIsDeletedFalse(@Param("companyId") UUID companyId, @Param("documentType") SalesDocumentType documentType);

    Optional<DeliveryTerm> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @Query("SELECT dt FROM DeliveryTerm dt WHERE dt.companyId = :companyId AND dt.documentType = :documentType AND dt.isDefault = true AND dt.isDeleted = false")
    Optional<DeliveryTerm> findDefaultByCompanyIdAndDocumentType(@Param("companyId") UUID companyId, @Param("documentType") SalesDocumentType documentType);

    @Query("SELECT CASE WHEN COUNT(dt) > 0 THEN true ELSE false END FROM DeliveryTerm dt " +
            "WHERE dt.companyId = :companyId AND dt.name = :name AND dt.documentType = :documentType AND dt.isDeleted = false")
    boolean existsByCompanyIdAndNameAndDocumentTypeAndIsDeletedFalse(@Param("companyId") UUID companyId, @Param("name") String name, @Param("documentType") SalesDocumentType documentType);
}
