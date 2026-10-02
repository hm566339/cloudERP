package com.erp.account.modules.hsnsacmaster.dto.response;

import java.util.List;

import com.erp.account.common.dto.response.PaginationResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class HsnSacMasterResponseList {

    private List<HsnSacMasterResponse> hsnSacMasters;
    private PaginationResponse paginationResponse;
}
