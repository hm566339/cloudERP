package com.erp.account.modules.gstslab.dto.response;

import java.util.List;

import com.erp.account.common.dto.response.PaginationResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class GstSlabResponseList {

    private List<GstSlabResponse> gstSlabs;
    private PaginationResponse paginationResponse;
}
