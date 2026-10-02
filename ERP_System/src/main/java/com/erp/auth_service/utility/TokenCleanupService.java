package com.erp.auth_service.utility;

import com.erp.auth_service.repository.AuthorizationCodeRepository;
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
        private final UserTokenRepository userTokenRepository;
        private final AuthorizationCodeRepository authorizationCodeRepository;

        @Scheduled(fixedRateString = "P7D")
        @Transactional
        public void cleanupExpiredTokens() {

                LocalDateTime now = LocalDateTime.now();

                // ================= SESSION CLEANUP =================
                int accessDeleted = ssoSessionRepository.deleteByAccessTokenValidTillBefore(now);

                // int refreshDeleted =
                // ssoSessionRepository.deleteByRefreshTokenValidTillBefore(now);

                // ================= USER TOKEN CLEANUP =================
                int userTokenExpiredDeleted = userTokenRepository.deleteByExpiresAtBefore(now);

                int userTokenUsedDeleted = userTokenRepository.deleteByUsedTrue();

                // ================= AUTH CODE CLEANUP =================
                int authCodeExpiredDeleted = authorizationCodeRepository.deleteByExpiresAtBefore(now);

                int authCodeUsedDeleted = authorizationCodeRepository.deleteByUsedTrue();

        }
}