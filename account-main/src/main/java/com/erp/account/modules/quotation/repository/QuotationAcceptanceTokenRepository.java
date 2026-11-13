package com.erp.account.modules.quotation.repository;

import com.erp.account.modules.quotation.entity.QuotationAcceptanceToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuotationAcceptanceTokenRepository extends JpaRepository<QuotationAcceptanceToken, UUID> {
    
    Optional<QuotationAcceptanceToken> findByTokenHash(String tokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM QuotationAcceptanceToken t WHERE t.tokenHash = :tokenHash")
    Optional<QuotationAcceptanceToken> findByTokenHashWithLock(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("UPDATE QuotationAcceptanceToken t SET t.revokedAt = :now, t.updatedAt = :now WHERE t.quotationId = :quotationId AND t.revokedAt IS NULL AND t.usedAt IS NULL")
    void revokeActiveTokensByQuotationId(@Param("quotationId") UUID quotationId, @Param("now") LocalDateTime now);
}
