package com.erp.auth_service.repository.platform;

import com.erp.auth_service.model.platform.PlatformAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PlatformAuditLogRepository extends JpaRepository<PlatformAuditLog, UUID> {

    Page<PlatformAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<PlatformAuditLog> findTop20ByOrderByCreatedAtDesc();

    long countByCreatedAtAfter(LocalDateTime since);
}
