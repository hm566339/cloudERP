package com.erp.auth_service.dto.platform;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportRevokeRequest {
    private String reason;
}
