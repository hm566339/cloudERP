package com.erp.account.modules.dashboard.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/account/debug")
@RequiredArgsConstructor
public class DebugController {

    @GetMapping
    public Map<String, Object> debug() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> response = new HashMap<>();
        response.put("authorities", auth != null ? auth.getAuthorities() : "null");
        response.put("authenticated", auth != null && auth.isAuthenticated());
        return response;
    }
}