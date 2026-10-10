package com.erp.communication.repository;

import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.model.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRequestRepository extends JpaRepository<NotificationRequest, UUID> {

    Optional<NotificationRequest> findByCompanyIdAndIdempotencyKey(UUID companyId, String idempotencyKey);

    Optional<NotificationRequest> findByIdAndCompanyId(UUID id, UUID companyId);

    Page<NotificationRequest> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);

    @Query("SELECT nr FROM NotificationRequest nr WHERE nr.status = :status AND (nr.nextRetryAt IS NULL OR nr.nextRetryAt <= :now) AND nr.retryCount < nr.maxRetries ORDER BY nr.createdAt ASC")
    List<NotificationRequest> findPendingRetries(@Param("status") NotificationStatus status,
                                                @Param("now") LocalDateTime now,
                                                Pageable pageable);
}
