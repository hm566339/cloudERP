package com.erp.auth_service.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationModuleItemResponse {
    private String key;
    private String name;
    private Boolean enabled;
}

