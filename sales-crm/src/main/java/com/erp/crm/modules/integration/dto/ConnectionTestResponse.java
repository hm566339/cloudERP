package com.erp.crm.modules.integration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionTestResponse {

    private boolean success;
    private boolean verified;
    private String message;
    private Object details;
}
