package com.erp.auth_service.controller;

import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.response.SessionPageResponse;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.service.SessionService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/session")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    // ================= HELPER =================
    private String extractBearerToken(String authHeader) {
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            throw new BadCredentialsException("Invalid Authorization header");
        }
        return authHeader.substring(7);
    }

    // ================= MY SESSIONS =================
    @GetMapping("/my")
    public ResponseEntity<ResponseWrapper<SessionPageResponse>> getMySessions(
            @RequestHeader("Authorization") String authHeader) {

        String accessToken = extractBearerToken(authHeader);
        return ResponseEntity.ok(ResponseWrapper.success(sessionService.getMySessions(accessToken)));
    }

    // ================= REVOKE ONE =================
    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> revokeSession(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id) {

        String accessToken = extractBearerToken(authHeader);
        sessionService.revokeSession(accessToken, id);

        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Session revoked")));
    }

    // ================= REVOKE ALL =================
    @DeleteMapping("/all")
    public ResponseEntity<ResponseWrapper<Map<String, Object>>> revokeAllSessions(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "false") boolean force) {

        String accessToken = extractBearerToken(authHeader);
        long count = sessionService.revokeAllSessions(accessToken, force);

        return ResponseEntity.ok(ResponseWrapper.success(Map.of(
                "message", "All sessions revoked",
                "count", count)));
    }

    // ================= SSO CALLBACK =================
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SessionController.class);

    @GetMapping("/sso/callback")
    public void callback(
            @RequestParam(name = "code", required = false) String code,
            @RequestParam(name = "goto", required = false) String gotoUrl,
            HttpServletResponse response) throws IOException {

        log.info("SSO CALLBACK HIT - code: {}, goto: {}", code, gotoUrl);

        sessionService.handleCallback(code, gotoUrl, response);
    }

    // ================= LOGOUT =================
    @PostMapping("/sso/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(value = "access_token", required = false) String accessToken,
            HttpServletResponse response) {

        log.info("Logout API hit");

        return sessionService.logout(accessToken, response);
    }

    // ================= REFRESH =================
    @GetMapping("/sso/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(value = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {

        log.info("Refresh API hit");

        if (!StringUtils.hasText(refreshToken)) {
            log.warn("Refresh token missing");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Refresh token missing"));
        }

        return sessionService.refresh(refreshToken, response);
    }

    @GetMapping("/all/{companyId}")
    public ResponseEntity<ResponseWrapper<SessionPageResponse>> getAllSessions(
            @PathVariable UUID companyId,
            @RequestParam int page,
            @RequestParam int pageSize) {
        return ResponseEntity.ok(ResponseWrapper.success(sessionService.getAllSessions(companyId, page, pageSize)));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> revokeSessionByAdmin(
            @PathVariable UUID id) {
        sessionService.revokeSessionByAdmin(id);

        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Session revoked")));
    }

}