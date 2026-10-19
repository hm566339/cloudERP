package com.erp.manufacturing.outbox.repository;

import com.erp.manufacturing.common.enums.OutboxStatus;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ManufacturingOutboxRepository extends JpaRepository<ManufacturingOutbox, UUID> {
    Optional<ManufacturingOutbox> findByCompanyIdAndIdempotencyKey(UUID companyId, String idempotencyKey);
    List<ManufacturingOutbox> findTop20ByStatusOrderByCreatedAtAsc(OutboxStatus status);

    @Query("SELECT o FROM ManufacturingOutbox o WHERE o.status = :pendingStatus OR (o.status = :failedStatus AND o.retryCount < 5 AND (o.nextAttemptAt IS NULL OR o.nextAttemptAt <= :now)) ORDER BY o.createdAt ASC")
    List<ManufacturingOutbox> findTop20PendingOrDueForRetry(
            @Param("pendingStatus") OutboxStatus pendingStatus,
            @Param("failedStatus") OutboxStatus failedStatus,
            @Param("now") LocalDateTime now);

    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query("UPDATE ManufacturingOutbox o SET o.status = :processingStatus, o.updatedAt = :now WHERE o.id = :id AND (o.status = :pendingStatus OR o.status = :failedStatus)")
    int claimForProcessing(
            @Param("id") UUID id,
            @Param("processingStatus") OutboxStatus processingStatus,
            @Param("pendingStatus") OutboxStatus pendingStatus,
            @Param("failedStatus") OutboxStatus failedStatus,
            @Param("now") LocalDateTime now);
}
