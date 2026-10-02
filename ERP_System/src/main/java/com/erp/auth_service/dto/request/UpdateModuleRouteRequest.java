package com.erp.auth_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class UpdateModuleRouteRequest {

    private UUID moduleId;

    private String apiPattern;

    private String serviceUrl;

    private Integer routeOrder;

    private Boolean active;
}
