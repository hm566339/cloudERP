package com.erp.auth_service.security;

import java.time.LocalDateTime;
import java.util.Collection;

import com.erp.auth_service.model.User;
import com.erp.auth_service.utility.AccountStatus;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class CustomUserDetails implements UserDetails {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (user == null || user.getUserRoles() == null) {
            return java.util.Collections.emptyList();
        }
        return user.getUserRoles().stream()
                .filter(ur -> ur != null && ur.getRole() != null && ur.getRole().getName() != null)
                .map(ur -> new SimpleGrantedAuthority(
                        ur.getRole().getName())) // ← no "ROLE_" prefix
                .toList();
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {

        return user.getLockedUntil() == null
                || user.getLockedUntil().isBefore(LocalDateTime.now());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {

        return user.getAccountStatus() == AccountStatus.ACTIVE;
    }
}