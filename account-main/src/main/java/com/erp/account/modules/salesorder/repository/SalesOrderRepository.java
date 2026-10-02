package com.erp.account.modules.salesorder.repository;

import com.erp.account.modules.salesorder.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, UUID>, JpaSpecificationExecutor<SalesOrder> {

    Optional<SalesOrder> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000")})
    @Query("SELECT so FROM SalesOrder so WHERE so.id = :id AND so.companyId = :companyId AND so.isDeleted = false")
    Optional<SalesOrder> findByIdAndCompanyIdAndIsDeletedFalseWithLock(@Param("id") UUID id, @Param("companyId") UUID companyId);

    @EntityGraph(attributePaths = {"items", "items.hsnSacMaster", "customer", "company"})
    Optional<SalesOrder> findWithItemsAndCustomerByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @EntityGraph(attributePaths = {"items", "items.hsnSacMaster", "customer", "company"})
    Optional<SalesOrder> findWithItemsAndCustomerByIdAndIsDeletedFalse(UUID id);

    Optional<SalesOrder> findBySoNumberAndCompanyIdAndIsDeletedFalse(String soNumber, UUID companyId);

    boolean existsBySoNumberAndCompanyIdAndIsDeletedFalse(String soNumber, UUID companyId);

    boolean existsBySourceQuotationIdAndCompanyIdAndIsDeletedFalse(UUID sourceQuotationId, UUID companyId);

    Page<SalesOrder> findAll(Specification<SalesOrder> spec, Pageable pageable);
}
