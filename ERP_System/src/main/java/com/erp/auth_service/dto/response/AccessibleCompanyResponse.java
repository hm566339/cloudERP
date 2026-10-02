package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Value;
import java.util.UUID;

@Value @Builder
public class AccessibleCompanyResponse {
    UUID id;
    String name;
    String code;
}