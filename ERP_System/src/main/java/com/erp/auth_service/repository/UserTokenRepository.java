package com.erp.auth_service.repository;

import com.erp.auth_service.model.UserToken;
import com.erp.auth_service.utility.TokenType;
import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, UUID> {

    Optional<UserToken> findByToken(String token);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM UserToken u WHERE u.expiresAt <= :now")
    int deleteByExpiresAtBefore(@Param("now") LocalDateTime now);

    void deleteByUser_Id(UUID userId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM UserToken u WHERE u.used = true")
    int deleteByUsedTrue();

    Optional<UserToken> findTopByUserIdAndTokenTypeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            UUID userId,
            TokenType tokenType,
            LocalDateTime now
    );
}
