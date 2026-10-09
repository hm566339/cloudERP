package com.erp.workflow.security;

import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;
import java.util.stream.Collectors;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserPrincipal implements UserDetails {

    private UUID userId;
    private UUID companyId;
    private String companyCode;
    private UUID organizationId;
    private String username;
    private String email;
    private String accessMode;
    private List<String> roles;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (roles == null) return Collections.emptyList();
        Set<SimpleGrantedAuthority> authorities = new LinkedHashSet<>();
        for (String r : roles) {
            if (r != null && !r.isBlank()) {
                String trimmed = r.trim().toUpperCase(Locale.ROOT);
                authorities.add(new SimpleGrantedAuthority(trimmed.startsWith("ROLE_") ? trimmed : "ROLE_" + trimmed));
                authorities.add(new SimpleGrantedAuthority(trimmed.startsWith("ROLE_") ? trimmed.substring(5) : trimmed));
            }
        }
        return new ArrayList<>(authorities);
    }

    public boolean isSystemAdmin() {
        if (roles == null) return false;
        return roles.stream().anyMatch(r -> "SYSTEM_ADMIN".equalsIgnoreCase(r) || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(r));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return username != null ? username : (email != null ? email : (userId != null ? userId.toString() : "anonymous"));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
