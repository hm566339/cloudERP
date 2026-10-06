package com.erp.auth_service.utility;

import com.erp.auth_service.repository.AuthorizationCodeRepository;
import com.erp.auth_service.repository.RefreshTokenRecordRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.repository.UserTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@RequiredArgsConstructor
@Service
@Slf4j
public class TokenCleanupService {

        private final SessionRepository ssoSessionRepository;
        private final RefreshTokenRecordRepository refreshTokenRecordRepository;
        private final UserTokenRepository userTokenRepository;
        private final AuthorizationCodeRepository authorizationCodeRepository;

        @Scheduled(fixedRateString = "P7D")
        @Transactional
        public void cleanupExpiredTokens() {

                LocalDateTime now = LocalDateTime.now();
                log.info("Starting scheduled token and session cleanup at {}", now);

                // ================= 1. CHILD-FIRST REFRESH TOKEN RECORD CLEANUP =================
                // 1a. Remove any legacy orphaned refresh_token_record rows without a valid session
                int orphanedRefreshDeleted = refreshTokenRecordRepository.deleteOrphanedRecords();
                if (orphanedRefreshDeleted > 0) {
                        log.info("Purged {} orphaned refresh_token_record row(s)", orphanedRefreshDeleted);
                }

                // 1b. Delete child refresh_token_record rows referencing expired sessions before deleting sessions
                int sessionRefreshDeleted = refreshTokenRecordRepository.deleteBySessionRefreshTokenValidTillBefore(now);

                // 1c. Delete standalone expired refresh_token_record rows (e.g. rotated tokens past expiry)
                int expiredRefreshDeleted = refreshTokenRecordRepository.deleteByExpiresAtBefore(now);

                // ================= 2. PARENT SESSION CLEANUP =================
                // Safely delete expired sessions now that all referencing child records have been removed
                int expiredSessionsDeleted = ssoSessionRepository.deleteByRefreshTokenValidTillBefore(now);

                // ================= 3. USER TOKEN CLEANUP =================
                int userTokenExpiredDeleted = userTokenRepository.deleteByExpiresAtBefore(now);
                int userTokenUsedDeleted = userTokenRepository.deleteByUsedTrue();

                // ================= 4. AUTH CODE CLEANUP =================
                int authCodeExpiredDeleted = authorizationCodeRepository.deleteByExpiresAtBefore(now);
                int authCodeUsedDeleted = authorizationCodeRepository.deleteByUsedTrue();

                log.info("Scheduled token cleanup completed | expiredSessionsDeleted={} | sessionRefreshDeleted={} | " +
                                "expiredRefreshDeleted={} | userTokenExpiredDeleted={} | userTokenUsedDeleted={} | " +
                                "authCodeExpiredDeleted={} | authCodeUsedDeleted={}",
                                expiredSessionsDeleted, sessionRefreshDeleted, expiredRefreshDeleted,
                                userTokenExpiredDeleted, userTokenUsedDeleted, authCodeExpiredDeleted, authCodeUsedDeleted);
        }
}