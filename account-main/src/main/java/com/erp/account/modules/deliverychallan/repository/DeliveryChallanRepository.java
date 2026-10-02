package com.erp.account.modules.deliverychallan.repository;

import com.erp.account.modules.deliverychallan.entity.DeliveryChallan;
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
public interface DeliveryChallanRepository extends JpaRepository<DeliveryChallan, UUID>, JpaSpecificationExecutor<DeliveryChallan> {
    Optional<DeliveryChallan> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000")})
    @Query("SELECT dc FROM DeliveryChallan dc WHERE dc.id = :id AND dc.companyId = :companyId AND dc.isDeleted = false")
    Optional<DeliveryChallan> findByIdAndCompanyIdAndIsDeletedFalseWithLock(@Param("id") UUID id, @Param("companyId") UUID companyId);

    boolean existsByDcNumberAndCompanyId(String dcNumber, UUID companyId);
}
