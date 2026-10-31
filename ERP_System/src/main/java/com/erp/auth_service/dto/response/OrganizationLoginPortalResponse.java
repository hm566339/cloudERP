package com.erp.auth_service.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationLoginPortalResponse {
    private String organizationCode;
    private String slug;
    private String loginUrl;
    private String previewUrl;
    private String status;
}

