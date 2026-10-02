package com.erp.auth_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuleRouteResponse {

    private UUID id;

    private UUID moduleId;

    private String moduleName;

    private String apiPattern;

    private String serviceUrl;

    private Integer routeOrder;

    private Boolean active;
}
