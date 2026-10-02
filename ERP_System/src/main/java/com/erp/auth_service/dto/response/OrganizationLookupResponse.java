package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class OrganizationLookupResponse {
    String name;
    String code;
    String loginUrl;
}