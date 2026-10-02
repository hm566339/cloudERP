package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CreateModuleRouteRequest;
import com.erp.auth_service.dto.request.UpdateModuleRouteRequest;
import com.erp.auth_service.dto.request.UpdateModuleRouteStatusRequest;
import com.erp.auth_service.dto.response.ModuleRouteListResponse;
import com.erp.auth_service.dto.response.ModuleRouteResponse;
import com.erp.auth_service.dto.response.MessageResponse;

import java.util.List;
import java.util.UUID;

public interface ModuleRouteService {

    ModuleRouteResponse createModuleRoute(CreateModuleRouteRequest request);

    ModuleRouteListResponse getAllModuleRoutes(Boolean active, UUID moduleId, int page, int pageSize);

    ModuleRouteResponse getModuleRouteById(UUID moduleRouteId);

    ModuleRouteResponse updateModuleRoute(UUID moduleRouteId, UpdateModuleRouteRequest request);

    MessageResponse updateModuleRouteStatus(UUID moduleRouteId, UpdateModuleRouteStatusRequest request);

    MessageResponse deleteModuleRoute(UUID moduleRouteId);

    List<ModuleRouteResponse> getActiveRoutes();
}
