package com.erp.account.modules.rfq.repository;
import com.erp.account.modules.rfq.entity.Rfq;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.*;
@Repository public interface RfqRepository extends JpaRepository<Rfq, UUID>, JpaSpecificationExecutor<Rfq> {
 @EntityGraph(attributePaths={"items","vendors"}) Optional<Rfq> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select r from Rfq r where r.id=:id and r.companyId=:companyId and r.isDeleted=false") Optional<Rfq> findForUpdate(@Param("id") UUID id,@Param("companyId") UUID companyId);
 @Query("SELECT r FROM Rfq r LEFT JOIN FETCH r.purchaseRequisition LEFT JOIN FETCH r.company WHERE r.id = :id AND r.companyId = :companyId AND r.isDeleted = false") Optional<Rfq> findForEmail(@Param("id") UUID id, @Param("companyId") UUID companyId);
 @Query("SELECT r FROM Rfq r LEFT JOIN FETCH r.purchaseRequisition LEFT JOIN FETCH r.company WHERE r.id = :id AND r.isDeleted = false") Optional<Rfq> findForEmail(@Param("id") UUID id);
 boolean existsByRfqNumberAndCompanyIdAndIsDeletedFalse(String number, UUID companyId);
 Page<Rfq> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
}
