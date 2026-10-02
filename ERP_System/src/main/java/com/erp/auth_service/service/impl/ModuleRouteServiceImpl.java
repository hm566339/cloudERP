package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.CreateModuleRouteRequest;
import com.erp.auth_service.dto.request.UpdateModuleRouteRequest;
import com.erp.auth_service.dto.request.UpdateModuleRouteStatusRequest;
import com.erp.auth_service.dto.response.MessageResponse;
import com.erp.auth_service.dto.response.ModuleRouteListResponse;
import com.erp.auth_service.dto.response.ModuleRouteResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.mapper.ModuleRouteMapper;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.ModuleRoute;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.repository.ModuleRouteRepository;
import com.erp.auth_service.service.ModuleRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.auth_service.dto.response.PaginationResponse;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ModuleRouteServiceImpl implements ModuleRouteService {

    private final ModuleRouteMapper moduleRouteMapper;
    private final ModuleRouteRepository moduleRouteRepository;
    private final ModuleRepository moduleRepository;

    @Override
    public ModuleRouteResponse createModuleRoute(CreateModuleRouteRequest request) {
        Module module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        if (moduleRouteRepository.existsByModule_IdAndApiPatternIgnoreCase(module.getId(), request.getApiPattern())) {
            throw new BadRequestException("A route with this API pattern already exists for the selected module");
        }

        ModuleRoute moduleRoute = moduleRouteMapper.toModuleRoute(request);
        moduleRoute.setModule(module);
        if (moduleRoute.getActive() == null) {
            moduleRoute.setActive(true);
        }
        if (moduleRoute.getRouteOrder() == null) {
            moduleRoute.setRouteOrder(0);
        }

        ModuleRoute saved = moduleRouteRepository.save(moduleRoute);
        return moduleRouteMapper.toModuleRouteResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ModuleRouteListResponse getAllModuleRoutes(Boolean active, UUID moduleId, int page, int pageSize) {
        int validatedPage = Math.max(page, 1);
        int validatedPageSize = Math.min(Math.max(pageSize, 1), 100);

        Pageable pageable = PageRequest.of(validatedPage - 1, validatedPageSize,
                Sort.by(Sort.Direction.DESC, "routeOrder"));

        Page<ModuleRoute> routePage;

        if (moduleId != null && active != null) {
            routePage = moduleRouteRepository.findByModule_IdAndActive(moduleId, active, pageable);
        } else if (moduleId != null) {
            routePage = moduleRouteRepository.findByModule_Id(moduleId, pageable);
        } else if (active != null) {
            routePage = moduleRouteRepository.findByActive(active, pageable);
        } else {
            routePage = moduleRouteRepository.findAll(pageable);
        }

        return ModuleRouteListResponse.builder()
                .moduleRoutes(moduleRouteMapper.toModuleRouteResponseList(routePage.getContent()))
                .pagination(PaginationResponse.builder()
                        .currentPage(validatedPage)
                        .pageSize(validatedPageSize)
                        .totalPages(routePage.getTotalPages())
                        .totalCount(routePage.getTotalElements())
                        .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ModuleRouteResponse getModuleRouteById(UUID moduleRouteId) {
        ModuleRoute moduleRoute = moduleRouteRepository.findById(moduleRouteId)
                .orElseThrow(() -> new ResourceNotFoundException("Module route not found"));

        return moduleRouteMapper.toModuleRouteResponse(moduleRoute);
    }

    @Override
    public ModuleRouteResponse updateModuleRoute(UUID moduleRouteId, UpdateModuleRouteRequest request) {
        ModuleRoute moduleRoute = moduleRouteRepository.findById(moduleRouteId)
                .orElseThrow(() -> new ResourceNotFoundException("Module route not found"));

        if (request.getModuleId() != null && !request.getModuleId().equals(moduleRoute.getModule().getId())) {
            Module module = moduleRepository.findById(request.getModuleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found"));
            moduleRoute.setModule(module);
        }

        if (request.getApiPattern() != null && !request.getApiPattern().equalsIgnoreCase(moduleRoute.getApiPattern())) {
            UUID moduleIdToCheck = moduleRoute.getModule().getId();
            if (moduleRouteRepository.existsByModule_IdAndApiPatternIgnoreCaseAndIdNot(
                    moduleIdToCheck, request.getApiPattern(), moduleRouteId)) {
                throw new BadRequestException("A route with this API pattern already exists for the selected module");
            }
            moduleRoute.setApiPattern(request.getApiPattern().trim());
        }

        if (request.getServiceUrl() != null) {
            moduleRoute.setServiceUrl(request.getServiceUrl().trim());
        }

        if (request.getRouteOrder() != null) {
            moduleRoute.setRouteOrder(request.getRouteOrder());
        }

        if (request.getActive() != null) {
            moduleRoute.setActive(request.getActive());
        }

        ModuleRoute updated = moduleRouteRepository.save(moduleRoute);
        return moduleRouteMapper.toModuleRouteResponse(updated);
    }

    @Override
    public MessageResponse updateModuleRouteStatus(UUID moduleRouteId, UpdateModuleRouteStatusRequest request) {
        ModuleRoute moduleRoute = moduleRouteRepository.findById(moduleRouteId)
                .orElseThrow(() -> new ResourceNotFoundException("Module route not found"));

        moduleRoute.setActive(request.getActive());
        moduleRouteRepository.save(moduleRoute);

        return new MessageResponse("Module route status updated successfully");
    }

    @Override
    public MessageResponse deleteModuleRoute(UUID moduleRouteId) {
        ModuleRoute moduleRoute = moduleRouteRepository.findById(moduleRouteId)
                .orElseThrow(() -> new ResourceNotFoundException("Module route not found"));

        moduleRoute.setActive(false);
        moduleRouteRepository.save(moduleRoute);

        return new MessageResponse("Module route disabled successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModuleRouteResponse> getActiveRoutes() {

        return moduleRouteRepository
                .findByActiveTrueOrderByRouteOrderAsc()
                .stream()
                .map(route -> ModuleRouteResponse.builder()
                        .id(route.getId())
                        .moduleId(route.getModule().getId())
                        .moduleName(route.getModule().getName())
                        .apiPattern(route.getApiPattern())
                        .serviceUrl(route.getServiceUrl())
                        .routeOrder(route.getRouteOrder())
                        .active(route.getActive())
                        .build())
                .toList();
    }
}
