package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApiErrorResponse {
    private int status;
    private String message;

}