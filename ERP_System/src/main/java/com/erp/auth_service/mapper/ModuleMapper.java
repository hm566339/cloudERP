package com.erp.auth_service.mapper;

import com.erp.auth_service.dto.request.CreateModuleRequest;
import com.erp.auth_service.dto.response.ModuleCreateResponse;
import com.erp.auth_service.dto.response.ModuleResponse;
import com.erp.auth_service.dto.response.ModuleSummaryResponse;
import com.erp.auth_service.model.Module;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;
import java.util.UUID;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ModuleMapper {

    Module toModule(CreateModuleRequest request);

    @Mapping(target = "clientId", source = "clientId", qualifiedByName = "uuidToString")
    ModuleCreateResponse toModuleCreateResponse(Module module);

    @Mapping(target = "clientId", source = "clientId", qualifiedByName = "uuidToString")
    ModuleResponse toModuleResponse(Module module);

    @Mapping(target = "clientId", source = "clientId", qualifiedByName = "uuidToString")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "updatedAt")
    ModuleSummaryResponse toModuleSummaryResponse(Module module);

    @Mapping(target = "clientSecret", source = "clientSecret")
    List<ModuleSummaryResponse> toModuleSummaryResponseList(List<Module> modules);

    @Named("uuidToString")
    default String uuidToString(UUID uuid) {
        return uuid != null ? uuid.toString() : null;
    }
}