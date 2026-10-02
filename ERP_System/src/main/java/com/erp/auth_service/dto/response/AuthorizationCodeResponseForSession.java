package com.erp.auth_service.dto.response;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthorizationCodeResponseForSession {

    private String code;
    private UUID clientId;
    private String clientSecret;

}
