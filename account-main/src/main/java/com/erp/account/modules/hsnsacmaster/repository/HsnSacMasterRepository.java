package com.erp.account.modules.hsnsacmaster.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import com.erp.account.modules.ledger.entity.TaxTransaction;

@Repository
public interface HsnSacMasterRepository
        extends JpaRepository<HsnSacMaster, UUID>, JpaSpecificationExecutor<HsnSacMaster> {

    Optional<HsnSacMaster> findByCodeIgnoreCase(String code);

    Optional<HsnSacMaster> findByCodeIgnoreCaseAndIsDeletedFalse(String code);

    Optional<HsnSacMaster> findByIdAndIsDeletedFalse(UUID id);

    boolean existsByCodeIgnoreCaseAndIsDeletedFalse(String code);

    @Query("SELECT COUNT(i) FROM SalesInvoiceItem i WHERE i.hsnSacMaster.id = :hsnSacId")
    long countInvoiceItemsByHsn(@Param("hsnSacId") UUID hsnSacId);

    @Query("SELECT COUNT(t) FROM TaxTransaction t WHERE t.hsnSacMaster.id = :hsnSacId")
    long countTaxTransactionsByHsn(@Param("hsnSacId") UUID hsnSacId);

    @Query("SELECT COUNT(i) FROM SalesInvoiceItem i WHERE i.hsnSacMaster.id = :hsnSacId")
    long countSalesInvoiceItemsByHsn(@Param("hsnSacId") UUID hsnSacId);

    List<HsnSacMaster> findByTypeAndIsDeletedFalse(String type);

    @Query("SELECT h.code FROM HsnSacMaster h WHERE UPPER(h.type) = UPPER(:type) AND h.isDeleted = false")
    List<String> findCodesByType(@Param("type") String type);

    Optional<HsnSacMaster> findByCodeAndIsDeletedFalse(String hsnSacCode);
}
