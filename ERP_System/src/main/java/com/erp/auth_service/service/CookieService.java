package com.erp.auth_service.service;

import com.erp.auth_service.dto.response.TokenResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;

@Service
public class CookieService {

    // ADD AUTH COOKIES
    public void addAuthCookies(HttpServletResponse response, TokenResponse tokenResponse) {

        response.addCookie(createSecureCookie(
                "ACCESS_TOKEN_REFRESH",
                tokenResponse.getRefreshToken(),
                7 * 24 * 60 * 60, // 7 days
                true));

        response.addCookie(createSecureCookie(
                "ACCESS_TOKEN",
                tokenResponse.getAccessToken(),
                15 * 60, // 15 minutes
                false // Javascript readable for SPA Authorization headers
        ));
        response.addCookie(createSecureCookie(
                "SSO_SESSION",
                tokenResponse.getUser().getId().toString(),
                7 * 24 * 60 * 60, // 7 days
                true));

        // Clear legacy cookies
        response.addCookie(deleteCookie("auth_token"));
        response.addCookie(deleteCookie("access_token"));
        response.addCookie(deleteCookie("refresh_token"));
    }

    // CLEAR COOKIES (LOGOUT)
    public void clearCookies(HttpServletResponse response) {
        response.addCookie(deleteCookie("ACCESS_TOKEN"));
        response.addCookie(deleteCookie("ACCESS_TOKEN_REFRESH"));
        response.addCookie(deleteCookie("SSO_SESSION"));
        response.addCookie(deleteCookie("auth_token"));
        response.addCookie(deleteCookie("access_token"));
        response.addCookie(deleteCookie("refresh_token"));
    }

    // CREATE SECURE COOKIE
    private Cookie createSecureCookie(String name, String value, int maxAge, boolean httpOnly) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(httpOnly);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        cookie.setAttribute("SameSite", "None"); // Important for cross-site SSO
        return cookie;
    }

    // DELETE COOKIE
    private Cookie deleteCookie(String name) {
        Cookie cookie = new Cookie(name, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "None");
        return cookie;
    }
}