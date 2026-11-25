package com.erp.communication.chat.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;

import java.security.Principal;
import java.util.Collection;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatUserPrincipal implements Principal {

    private String name;
    private UUID userId;
    private UUID companyId;
    private String caller;
    private Collection<? extends GrantedAuthority> authorities;

    @Override
    public String getName() {
        return name != null ? name : (userId != null ? userId.toString() : "anonymous");
    }
}
