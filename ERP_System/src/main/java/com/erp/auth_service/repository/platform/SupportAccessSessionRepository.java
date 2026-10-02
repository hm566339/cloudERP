package com.erp.auth_service.repository.platform;

import com.erp.auth_service.model.platform.SupportAccessSession;
import com.erp.auth_service.model.platform.SupportSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SupportAccessSessionRepository extends JpaRepository<SupportAccessSession, UUID> {

    List<SupportAccessSession> findByPlatformAdmin_IdOrderByCreatedAtDesc(UUID platformAdminId);

    List<SupportAccessSession> findByOrganization_IdOrderByCreatedAtDesc(UUID organizationId);

    long countByStatus(SupportSessionStatus status);

    @Query("SELECT COUNT(s) FROM SupportAccessSession s WHERE s.status = :status AND s.expiresAt > :now")
    long countActiveNotExpired(@Param("status") SupportSessionStatus status, @Param("now") LocalDateTime now);

    List<SupportAccessSession> findTop10ByOrderByCreatedAtDesc();
}
