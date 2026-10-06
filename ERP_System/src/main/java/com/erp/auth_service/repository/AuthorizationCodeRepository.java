package com.erp.auth_service.repository;

import com.erp.auth_service.model.AuthorizationCode;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface AuthorizationCodeRepository
        extends JpaRepository<AuthorizationCode, String> {

    /*
     * FIND BY CODE
     */
    Optional<AuthorizationCode> findByCode(String code);

    /*
     * CLEANUP
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM AuthorizationCode a WHERE a.expiresAt <= :now")
    int deleteByExpiresAtBefore(@Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM AuthorizationCode a WHERE a.used = true")
    int deleteByUsedTrue();

    /*
     * TOTAL AUTHORIZATION CODES
     */
    long countByCompanyId(UUID companyId);

    /*
     * ACTIVE AUTHORIZATION CODES
     *
     * used = false
     * expiresAt > now
     */
    @Query("""
        SELECT COUNT(ac)
        FROM AuthorizationCode ac
        WHERE ac.company.id = :companyId
          AND ac.used = false
          AND ac.expiresAt > :now
    """)
    long countActiveCodes(
            @Param("companyId") UUID companyId,
            @Param("now") LocalDateTime now
    );

    /*
     * USED AUTHORIZATION CODES
     */
    @Query("""
        SELECT COUNT(ac)
        FROM AuthorizationCode ac
        WHERE ac.company.id = :companyId
          AND ac.used = true
    """)
    long countUsedCodes(
            @Param("companyId") UUID companyId
    );

    /*
     * EXPIRED AUTHORIZATION CODES
     */
    @Query("""
        SELECT COUNT(ac)
        FROM AuthorizationCode ac
        WHERE ac.company.id = :companyId
          AND ac.expiresAt <= :now
    """)
    long countExpiredCodes(
            @Param("companyId") UUID companyId,
            @Param("now") LocalDateTime now
    );
}