package com.erp.inventory.common.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@Builder
public class PaginationResponse {
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;
    
    @JsonIgnore @Deprecated private int currentPage;
    @JsonIgnore @Deprecated private int pageSize;
    @JsonIgnore @Deprecated private int numberOfElements;
    @JsonIgnore @Deprecated private boolean first;
    @JsonIgnore @Deprecated private boolean last;
}
