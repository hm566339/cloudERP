package com.erp.auth_service.repository;

import com.erp.auth_service.model.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {

        @EntityGraph(attributePaths = { "user", "company", "module", "organization" })
        Optional<Session> findByAccessToken(String accessToken);

        Optional<Session> findByRefreshToken(String refreshToken);

        List<Session> findAllByUser_Id(UUID userId);

        List<Session> findAllByUser_IdAndCompany_IdAndModule_Id(
                        UUID userId,
                        UUID companyId,
                        UUID moduleId);

        List<Session> findAllByUser_IdAndCompany_Id(
                        UUID userId,
                        UUID companyId);

        List<Session> findAllByUser_IdAndAccessTokenValidTillAfter(UUID userId, LocalDateTime now);

        @Modifying(clearAutomatically = true)
        @Query("DELETE FROM Session s WHERE s.accessTokenValidTill <= :now")
        int deleteByAccessTokenValidTillBefore(@Param("now") LocalDateTime now);

        @Modifying(clearAutomatically = true)
        @Query("DELETE FROM Session s WHERE s.refreshTokenValidTill <= :now")
        int deleteByRefreshTokenValidTillBefore(@Param("now") LocalDateTime now);

        @Modifying(clearAutomatically = true)
        @Query("DELETE FROM Session s WHERE s.accessToken = :accessToken")
        void deleteByAccessToken(@Param("accessToken") String accessToken);

        @Modifying
        @Query("DELETE FROM Session s WHERE s.user.id = :userId")
        void deleteByUser_Id(@Param("userId") UUID userId);

        // ================= DASHBOARD =================

        @Query("""
                            SELECT COUNT(s)
                            FROM Session s
                            WHERE s.accessTokenValidTill > :now
                        """)
        long countActiveSessions(@Param("now") LocalDateTime now);

        @Query("""
                            SELECT COUNT(s)
                            FROM Session s
                            WHERE s.accessTokenValidTill <= :now
                        """)
        long countExpiredSessions(@Param("now") LocalDateTime now);

        @EntityGraph(attributePaths = { "user", "module" })
        Page<Session> findAll(Pageable pageable);

        @Query("""
                            SELECT COUNT(s)
                            FROM Session s
                            WHERE s.user.id = :userId
                            AND s.accessTokenValidTill > :now
                        """)
        int countUserActiveSessions(
                        @Param("userId") UUID userId,
                        @Param("now") LocalDateTime now);

        @Query("""
                            SELECT COUNT(s)
                            FROM Session s
                            WHERE s.company.id = :companyId
                        """)
        long countByCompanyId(@Param("companyId") UUID companyId);

        @Query("""
                            SELECT COUNT(s)
                            FROM Session s
                            WHERE s.company.id = :companyId
                              AND s.accessTokenValidTill > :now
                        """)
        long countActiveSessionsByCompany(
                        @Param("companyId") UUID companyId,
                        @Param("now") LocalDateTime now);

        @Query("""
                            SELECT COUNT(s)
                            FROM Session s
                            WHERE s.company.id = :companyId
                              AND s.accessTokenValidTill <= :now
                        """)
        long countExpiredSessionsByCompany(
                        @Param("companyId") UUID companyId,
                        @Param("now") LocalDateTime now);

        @Query("""
                        SELECT s
                        FROM Session s
                        WHERE s.company.id = :companyId
                        ORDER BY s.createdAt DESC
                        """)
        Page<Session> findAllByCompanyId(
                        @Param("companyId") UUID companyId,
                        Pageable pageable);
}