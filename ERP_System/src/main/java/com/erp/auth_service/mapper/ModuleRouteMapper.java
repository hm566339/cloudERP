package com.erp.auth_service.mapper;

import com.erp.auth_service.dto.request.CreateModuleRouteRequest;
import com.erp.auth_service.dto.request.UpdateModuleRouteRequest;
import com.erp.auth_service.dto.response.ModuleRouteResponse;
import com.erp.auth_service.model.ModuleRoute;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ModuleRouteMapper {

    ModuleRoute toModuleRoute(CreateModuleRouteRequest request);

    ModuleRoute toModuleRoute(UpdateModuleRouteRequest request);

    @Mapping(target = "moduleId", source = "module.id")
    @Mapping(target = "moduleName", source = "module.name")
    ModuleRouteResponse toModuleRouteResponse(ModuleRoute moduleRoute);

    List<ModuleRouteResponse> toModuleRouteResponseList(List<ModuleRoute> moduleRoutes);
}
