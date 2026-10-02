package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CreateModuleRequest;
import com.erp.auth_service.dto.request.UpdateModuleRequest;
import com.erp.auth_service.dto.request.UpdateModuleStatusRequest;
import com.erp.auth_service.dto.response.*;

import java.util.List;

import java.util.UUID;

public interface ModuleService {

    ModuleCreateResponse createModule(CreateModuleRequest request);

    ModuleListResponse getAllModules(
            Boolean status,
            int page,
            int pageSize,
            String search
    );

    ModuleSummaryResponse getModuleById(UUID moduleId);

    ModuleResponse updateModule(UUID moduleId, UpdateModuleRequest request);

    ModuleStatusResponse updateModuleStatus(UUID moduleId, UpdateModuleStatusRequest request);

    RotateSecretResponse rotateSecret(UUID moduleId);

    MessageResponse deleteModule(UUID moduleId);

    List<String> getAllHosts();
}