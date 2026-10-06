package com.erp.auth_service.repository;

import com.erp.auth_service.model.RefreshTokenRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRecordRepository extends JpaRepository<RefreshTokenRecord, UUID> {
    Optional<RefreshTokenRecord> findByTokenHash(String tokenHash);

    List<RefreshTokenRecord> findAllByFamilyId(UUID familyId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM RefreshTokenRecord r WHERE r.session.id NOT IN (SELECT s.id FROM Session s)")
    int deleteOrphanedRecords();

    @Modifying(clearAutomatically = true)
    @Query("""
        DELETE FROM RefreshTokenRecord r
        WHERE r.session.id IN (
            SELECT s.id FROM Session s
            WHERE s.refreshTokenValidTill <= :cutoff
        )
    """)
    int deleteBySessionRefreshTokenValidTillBefore(@Param("cutoff") LocalDateTime cutoff);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM RefreshTokenRecord r WHERE r.expiresAt <= :cutoff")
    int deleteByExpiresAtBefore(@Param("cutoff") LocalDateTime cutoff);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM RefreshTokenRecord r WHERE r.session.id = :sessionId")
    int deleteBySessionId(@Param("sessionId") UUID sessionId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM RefreshTokenRecord r WHERE r.session.id IN :sessionIds")
    int deleteBySessionIdIn(@Param("sessionIds") Collection<UUID> sessionIds);
}