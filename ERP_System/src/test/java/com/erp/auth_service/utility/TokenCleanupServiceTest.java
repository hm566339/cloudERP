package com.erp.auth_service.utility;

import com.erp.auth_service.repository.AuthorizationCodeRepository;
import com.erp.auth_service.repository.RefreshTokenRecordRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.repository.UserTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenCleanupServiceTest {

    @Mock
    private SessionRepository ssoSessionRepository;

    @Mock
    private RefreshTokenRecordRepository refreshTokenRecordRepository;

    @Mock
    private UserTokenRepository userTokenRepository;

    @Mock
    private AuthorizationCodeRepository authorizationCodeRepository;

    @InjectMocks
    private TokenCleanupService tokenCleanupService;

    @BeforeEach
    void setUp() {
        // Reset default mock returns
        when(refreshTokenRecordRepository.deleteOrphanedRecords()).thenReturn(0);
        when(refreshTokenRecordRepository.deleteBySessionRefreshTokenValidTillBefore(any())).thenReturn(0);
        when(refreshTokenRecordRepository.deleteByExpiresAtBefore(any())).thenReturn(0);
        when(ssoSessionRepository.deleteByRefreshTokenValidTillBefore(any())).thenReturn(0);
        when(userTokenRepository.deleteByExpiresAtBefore(any())).thenReturn(0);
        when(userTokenRepository.deleteByUsedTrue()).thenReturn(0);
        when(authorizationCodeRepository.deleteByExpiresAtBefore(any())).thenReturn(0);
        when(authorizationCodeRepository.deleteByUsedTrue()).thenReturn(0);
    }

    @Test
    @DisplayName("1. Session with refresh token record: child records deleted first, then session deleted successfully")
    void testCleanupSessionWithRefreshTokenRecord_childFirstExecution() {
        // Arrange
        when(refreshTokenRecordRepository.deleteBySessionRefreshTokenValidTillBefore(any(LocalDateTime.class)))
                .thenReturn(1);
        when(ssoSessionRepository.deleteByRefreshTokenValidTillBefore(any(LocalDateTime.class)))
                .thenReturn(1);

        // Act
        assertDoesNotThrow(() -> tokenCleanupService.cleanupExpiredTokens());

        // Assert: Enforce strict child-first deletion order
        InOrder inOrder = inOrder(refreshTokenRecordRepository, ssoSessionRepository);
        inOrder.verify(refreshTokenRecordRepository).deleteOrphanedRecords();
        inOrder.verify(refreshTokenRecordRepository).deleteBySessionRefreshTokenValidTillBefore(any(LocalDateTime.class));
        inOrder.verify(refreshTokenRecordRepository).deleteByExpiresAtBefore(any(LocalDateTime.class));
        inOrder.verify(ssoSessionRepository).deleteByRefreshTokenValidTillBefore(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("2. Session without refresh token record: session cleanup succeeds safely")
    void testCleanupSessionWithoutRefreshTokenRecord_succeeds() {
        // Arrange: 0 refresh token records, 2 expired sessions without refresh records
        when(refreshTokenRecordRepository.deleteBySessionRefreshTokenValidTillBefore(any(LocalDateTime.class)))
                .thenReturn(0);
        when(ssoSessionRepository.deleteByRefreshTokenValidTillBefore(any(LocalDateTime.class)))
                .thenReturn(2);

        // Act & Assert
        assertDoesNotThrow(() -> tokenCleanupService.cleanupExpiredTokens());

        verify(refreshTokenRecordRepository).deleteBySessionRefreshTokenValidTillBefore(any(LocalDateTime.class));
        verify(ssoSessionRepository).deleteByRefreshTokenValidTillBefore(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("3. Multiple refresh token records for one session: all child records deleted before session")
    void testCleanupMultipleRefreshTokenRecordsForOneSession_childFirstSucceeds() {
        // Arrange: Session was rotated multiple times, generating 4 refresh token records
        when(refreshTokenRecordRepository.deleteBySessionRefreshTokenValidTillBefore(any(LocalDateTime.class)))
                .thenReturn(4);
        when(ssoSessionRepository.deleteByRefreshTokenValidTillBefore(any(LocalDateTime.class)))
                .thenReturn(1);

        // Act
        assertDoesNotThrow(() -> tokenCleanupService.cleanupExpiredTokens());

        // Assert: Child records deleted first, then session
        InOrder inOrder = inOrder(refreshTokenRecordRepository, ssoSessionRepository);
        inOrder.verify(refreshTokenRecordRepository).deleteBySessionRefreshTokenValidTillBefore(any(LocalDateTime.class));
        inOrder.verify(ssoSessionRepository).deleteByRefreshTokenValidTillBefore(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("4. Re-running cleanup (idempotency): multiple invocations succeed without errors")
    void testCleanupIdempotency_multipleRunsSucceedWithoutErrors() {
        // First run: finds records and deletes them
        when(refreshTokenRecordRepository.deleteBySessionRefreshTokenValidTillBefore(any(LocalDateTime.class)))
                .thenReturn(3);
        when(ssoSessionRepository.deleteByRefreshTokenValidTillBefore(any(LocalDateTime.class)))
                .thenReturn(2);

        assertDoesNotThrow(() -> tokenCleanupService.cleanupExpiredTokens());

        // Second run: no records left to delete (returns 0)
        when(refreshTokenRecordRepository.deleteBySessionRefreshTokenValidTillBefore(any(LocalDateTime.class)))
                .thenReturn(0);
        when(ssoSessionRepository.deleteByRefreshTokenValidTillBefore(any(LocalDateTime.class)))
                .thenReturn(0);

        assertDoesNotThrow(() -> tokenCleanupService.cleanupExpiredTokens());

        // Third run: still idempotent
        assertDoesNotThrow(() -> tokenCleanupService.cleanupExpiredTokens());

        verify(refreshTokenRecordRepository, times(3)).deleteBySessionRefreshTokenValidTillBefore(any(LocalDateTime.class));
        verify(ssoSessionRepository, times(3)).deleteByRefreshTokenValidTillBefore(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("5. Active / non-expired sessions are preserved and not deleted prematurely")
    void testActiveSessionsAreNotAccidentallyDeleted() {
        LocalDateTime beforeRun = LocalDateTime.now().minusSeconds(1);

        // Act
        tokenCleanupService.cleanupExpiredTokens();

        LocalDateTime afterRun = LocalDateTime.now().plusSeconds(1);

        // Capture cutoff time passed to delete queries
        ArgumentCaptor<LocalDateTime> sessionCutoffCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(ssoSessionRepository).deleteByRefreshTokenValidTillBefore(sessionCutoffCaptor.capture());

        LocalDateTime capturedCutoff = sessionCutoffCaptor.getValue();
        assertNotNull(capturedCutoff);

        // The cutoff must be within the execution window (current timestamp)
        assertTrue(!capturedCutoff.isBefore(beforeRun) && !capturedCutoff.isAfter(afterRun),
                "Session deletion cutoff must target expired sessions up to now, preserving active future sessions");

        // CRITICAL: verify deleteByAccessTokenValidTillBefore is NEVER called in TokenCleanupService,
        // because access tokens expire in 15 mins while active sessions and refresh tokens last 7 days.
        verify(ssoSessionRepository, never()).deleteByAccessTokenValidTillBefore(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("6. Orphaned refresh token records from legacy/dirty data are purged first")
    void testOrphanedRefreshTokenRecordsPurgedFirst() {
        // Arrange
        when(refreshTokenRecordRepository.deleteOrphanedRecords()).thenReturn(5);

        // Act
        assertDoesNotThrow(() -> tokenCleanupService.cleanupExpiredTokens());

        // Assert
        InOrder inOrder = inOrder(refreshTokenRecordRepository, ssoSessionRepository);
        inOrder.verify(refreshTokenRecordRepository).deleteOrphanedRecords();
        inOrder.verify(refreshTokenRecordRepository).deleteBySessionRefreshTokenValidTillBefore(any(LocalDateTime.class));
        inOrder.verify(ssoSessionRepository).deleteByRefreshTokenValidTillBefore(any(LocalDateTime.class));
    }
}
