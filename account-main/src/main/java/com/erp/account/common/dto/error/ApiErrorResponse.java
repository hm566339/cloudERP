package com.erp.account.common.dto.error;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiErrorResponse extends BaseResponseDto  {

    @Builder.Default
    private boolean success = false;

    private String message;

    @Builder.Default
    private Instant timestamp = Instant.now();

    private ErrorBody error;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorBody {
        private String code;
        private List<ErrorDetail> details;
        private String traceId;
    }
}
