package com.erp.account.modules.company.dto.response;

import java.util.List;

import com.erp.account.common.dto.response.PaginationResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class CompanyResponseList {

    private List<CompanyResponse> company;

    private PaginationResponse paginationResponse;

}
