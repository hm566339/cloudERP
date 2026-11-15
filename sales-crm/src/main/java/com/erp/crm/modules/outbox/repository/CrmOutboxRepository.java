package com.erp.crm.modules.outbox.repository;

import com.erp.crm.modules.outbox.entity.CrmOutbox;
import com.erp.crm.modules.outbox.enums.OutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmOutboxRepository extends JpaRepository<CrmOutbox, UUID> {
    Optional<CrmOutbox> findByCompanyIdAndIdempotencyKey(UUID companyId, String idempotencyKey);
    List<CrmOutbox> findByStatusAndNextAttemptAtLessThanEqual(OutboxStatus status, LocalDateTime now, Pageable pageable);
}

