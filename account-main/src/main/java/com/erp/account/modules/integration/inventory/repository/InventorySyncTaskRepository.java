package com.erp.account.modules.integration.inventory.repository;

import com.erp.account.modules.integration.inventory.entity.InventorySyncTask;
import com.erp.account.modules.integration.inventory.entity.SyncStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

@Repository
public interface InventorySyncTaskRepository extends JpaRepository<InventorySyncTask, UUID> {
    
    Optional<InventorySyncTask> findByInvoiceId(UUID invoiceId);

    /**
     * Finds an existing outbox task for the given entity ID and event type.
     * Used to enforce idempotency: e.g., prevent two GRN_STOCK_OUT tasks for the same GRN,
     * while still allowing GRN_STOCK_IN and GRN_STOCK_OUT for the same GRN to coexist.
     */
    Optional<InventorySyncTask> findByInvoiceIdAndEventType(UUID invoiceId, String eventType);

    @Query("SELECT t FROM InventorySyncTask t WHERE t.status IN :statuses AND t.retryCount < :maxRetries AND (t.nextRetryAt IS NULL OR t.nextRetryAt <= :now) ORDER BY t.createdAt ASC")
    List<InventorySyncTask> findEligibleTasks(@Param("statuses") List<SyncStatus> statuses, @Param("maxRetries") int maxRetries, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE InventorySyncTask t SET t.status = :newStatus, t.updatedAt = CURRENT_TIMESTAMP, t.updatedByUsername = 'system' WHERE t.id = :id AND t.status IN :oldStatuses")
    int claimTask(@Param("id") UUID id, @Param("oldStatuses") List<SyncStatus> oldStatuses, @Param("newStatus") SyncStatus newStatus);
}
