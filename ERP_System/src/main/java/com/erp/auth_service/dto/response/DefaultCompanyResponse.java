package com.erp.auth_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DefaultCompanyResponse {
    private UUID memberId;
    private UUID userId;
    private UUID organizationId;
    private UUID defaultCompanyId;
    private String defaultCompanyName;
    private String defaultCompanyCode;
}

