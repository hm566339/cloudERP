package com.erp.auth_service.service;

import com.erp.auth_service.dto.response.AuthorizationCodeResponseForSession;
import com.erp.auth_service.dto.response.SessionPageResponse;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.UUID;

import org.springframework.http.ResponseEntity;

public interface SessionService {

    SessionPageResponse getMySessions(String accessToken);

    void revokeSession(String accessToken, UUID sessionId);

    long revokeAllSessions(String accessToken, boolean force);

    AuthorizationCodeResponseForSession getClientDetail(String code);

    void markCodeAsUsed(String code);

    void handleCallback(String code, String gotoUrl, HttpServletResponse response) throws IOException;

    ResponseEntity<Void> logout(String accessToken, HttpServletResponse response);

    ResponseEntity<?> refresh(String refreshToken, HttpServletResponse response);

    SessionPageResponse getAllSessions(
            UUID companyId,
            int page,
            int pageSize);

    void revokeSessionByAdmin(UUID id);
}