package com.erp.auth_service.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationCompanyListResponse {
    private List<OrganizationCompanyResponse> companies;
    private int totalCount;
    private int activeCount;
}

