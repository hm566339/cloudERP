package com.erp.account.common.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaginationResponse extends BaseResponseDto  {

    private Integer page;
    private Integer size;
    private Long totalElements;
    private Integer totalPages;
    private Boolean hasNext;
    private Boolean hasPrevious;

    public boolean isHasNext() {
        return Boolean.TRUE.equals(hasNext);
    }

    public boolean isHasPrevious() {
        return Boolean.TRUE.equals(hasPrevious);
    }
    
    public static class PaginationResponseBuilder {
        public PaginationResponseBuilder totalElements(long totalElements) {
            this.totalElements = totalElements;
            return this;
        }
    }
    
    // Legacy fields hidden from JSON response but preserved for backward compatibility
    @JsonIgnore @Deprecated private Integer currentPage;
    @JsonIgnore @Deprecated private Integer pageSize;
    @JsonIgnore @Deprecated private Integer numberOfElements;
    @JsonIgnore @Deprecated private Boolean first;
    @JsonIgnore @Deprecated private Boolean last;
}
