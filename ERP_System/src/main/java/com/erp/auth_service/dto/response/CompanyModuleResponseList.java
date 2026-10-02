package com.erp.auth_service.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class CompanyModuleResponseList {

    private List<CompanyModuleResponse> companyModuleResponse;

    private PaginationResponse pagination;

}
