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
                int orphanedRefreshDeleted = 0;
                try {
                        orphanedRefreshDeleted = refreshTokenRecordRepository.deleteOrphanedRecords();
                        if (orphanedRefreshDeleted > 0) {
                                log.info("Purged {} orphaned refresh_token_record row(s)", orphanedRefreshDeleted);
                        }
                } catch (Exception ex) {
                        log.error("Failed to purge orphaned refresh_token_record rows: {}", ex.getMessage(), ex);
                }

                // 1b. Delete child refresh_token_record rows referencing expired sessions before deleting sessions
                int sessionRefreshDeleted = 0;
                try {
                        sessionRefreshDeleted = refreshTokenRecordRepository.deleteBySessionRefreshTokenValidTillBefore(now);
                } catch (Exception ex) {
                        log.error("Failed to delete refresh token records for expired sessions: {}", ex.getMessage(), ex);
                }

                // 1c. Delete standalone expired refresh_token_record rows (e.g. rotated tokens past expiry)
                int expiredRefreshDeleted = 0;
                try {
                        expiredRefreshDeleted = refreshTokenRecordRepository.deleteByExpiresAtBefore(now);
                } catch (Exception ex) {
                        log.error("Failed to delete standalone expired refresh token records: {}", ex.getMessage(), ex);
                }

                // ================= 2. PARENT SESSION CLEANUP =================
                // Safely delete expired sessions now that all referencing child records have been removed
                int expiredSessionsDeleted = 0;
                try {
                        expiredSessionsDeleted = ssoSessionRepository.deleteByRefreshTokenValidTillBefore(now);
                } catch (Exception ex) {
                        log.error("Failed to delete expired sessions: {}", ex.getMessage(), ex);
                }

                // ================= 3. USER TOKEN CLEANUP =================
                int userTokenExpiredDeleted = 0;
                try {
                        userTokenExpiredDeleted = userTokenRepository.deleteByExpiresAtBefore(now);
                } catch (Exception ex) {
                        log.error("Failed to delete expired user tokens: {}", ex.getMessage(), ex);
                }

                int userTokenUsedDeleted = 0;
                try {
                        userTokenUsedDeleted = userTokenRepository.deleteByUsedTrue();
                } catch (Exception ex) {
                        log.error("Failed to delete used user tokens: {}", ex.getMessage(), ex);
                }

                // ================= 4. AUTH CODE CLEANUP =================
                int authCodeExpiredDeleted = 0;
                try {
                        authCodeExpiredDeleted = authorizationCodeRepository.deleteByExpiresAtBefore(now);
                } catch (Exception ex) {
                        log.error("Failed to delete expired authorization codes: {}", ex.getMessage(), ex);
                }

                int authCodeUsedDeleted = 0;
                try {
                        authCodeUsedDeleted = authorizationCodeRepository.deleteByUsedTrue();
                } catch (Exception ex) {
                        log.error("Failed to delete used authorization codes: {}", ex.getMessage(), ex);
                }

                log.info("Scheduled token cleanup completed | expiredSessionsDeleted={} | sessionRefreshDeleted={} | " +
                                "expiredRefreshDeleted={} | userTokenExpiredDeleted={} | userTokenUsedDeleted={} | " +
                                "authCodeExpiredDeleted={} | authCodeUsedDeleted={}",
                                expiredSessionsDeleted, sessionRefreshDeleted, expiredRefreshDeleted,
                                userTokenExpiredDeleted, userTokenUsedDeleted, authCodeExpiredDeleted, authCodeUsedDeleted);
        }
}