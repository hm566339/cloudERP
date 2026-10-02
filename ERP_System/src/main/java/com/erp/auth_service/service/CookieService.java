package com.erp.auth_service.service;

import com.erp.auth_service.dto.response.TokenResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;

@Service
public class CookieService {

    //  ADD AUTH COOKIES
    public void addAuthCookies(HttpServletResponse response, TokenResponse tokenResponse) {

        response.addCookie(createSecureCookie(
                "ACCESS_TOKEN_REFRESH",
                tokenResponse.getRefreshToken(),
                7 * 24 * 60 * 60 // 7 days
        ));

        response.addCookie(createSecureCookie(
                "ACCESS_TOKEN",
                tokenResponse.getAccessToken(),
                15 * 60 // 15 minutes
        ));
        response.addCookie(createSecureCookie(
                "SSO_SESSION",
                tokenResponse.getUser().getId().toString(),
                7 * 24 * 60 * 60 // 7 days
        ));
    }

    //  CLEAR COOKIES (LOGOUT)
    public void clearCookies(HttpServletResponse response) {
        response.addCookie(deleteCookie("ACCESS_TOKEN"));
        response.addCookie(deleteCookie("ACCESS_TOKEN_REFRESH"));
        response.addCookie(deleteCookie("SSO_SESSION"));
    }

    //  CREATE SECURE COOKIE
    private Cookie createSecureCookie(String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        cookie.setAttribute("SameSite", "None"); // Important for cross-site SSO
        return cookie;
    }

    //  DELETE COOKIE
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