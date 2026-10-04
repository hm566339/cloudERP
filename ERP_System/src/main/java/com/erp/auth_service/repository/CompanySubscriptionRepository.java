package com.erp.auth_service.repository;

import com.erp.auth_service.model.CompanySubscription;
import com.erp.auth_service.utility.CompanySubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanySubscriptionRepository extends JpaRepository<CompanySubscription, UUID> {

    Optional<CompanySubscription> findTopByCompany_IdOrderByCreatedAtDesc(UUID companyId);

    Optional<CompanySubscription> findTopByCompany_IdAndStatusInOrderByCreatedAtDesc(
            UUID companyId, Collection<CompanySubscriptionStatus> statuses);

    List<CompanySubscription> findByCompany_IdOrderByCreatedAtDesc(UUID companyId);

    List<CompanySubscription> findByStatusIn(Collection<CompanySubscriptionStatus> statuses);

    @Query("SELECT cs FROM CompanySubscription cs WHERE cs.status IN :statuses AND cs.endAt <= :now")
    List<CompanySubscription> findExpiredSubscriptions(
            @Param("statuses") Collection<CompanySubscriptionStatus> statuses,
            @Param("now") LocalDateTime now);

    boolean existsByCompany_IdAndStatus(UUID companyId, CompanySubscriptionStatus status);

    long countByStatus(CompanySubscriptionStatus status);
}
