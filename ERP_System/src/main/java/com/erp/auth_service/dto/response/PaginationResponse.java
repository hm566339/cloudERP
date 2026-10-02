package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaginationResponse {

    private int currentPage;
    private int pageSize;
    private int totalPages;
    private long totalCount;
}