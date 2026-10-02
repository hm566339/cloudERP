package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.CreateModuleRouteRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.request.UpdateModuleRouteRequest;
import com.erp.auth_service.dto.request.UpdateModuleRouteStatusRequest;
import com.erp.auth_service.dto.response.MessageResponse;
import com.erp.auth_service.dto.response.ModuleRouteListResponse;
import com.erp.auth_service.dto.response.ModuleRouteResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.service.ModuleRouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/module-routes")
@RequiredArgsConstructor
public class ModuleRouteController {

    private final ModuleRouteService moduleRouteService;

    @PostMapping
    public ResponseEntity<ResponseWrapper<ModuleRouteResponse>> createModuleRoute(
            @Valid @RequestBody RequestWrapper<CreateModuleRouteRequest> request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.success(moduleRouteService.createModuleRoute(request.getData())));
    }

    @GetMapping
    public ResponseEntity<ResponseWrapper<ModuleRouteListResponse>> getAllModuleRoutes(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) UUID moduleId,
            @RequestParam int page,
            @RequestParam int pageSize) {
        return ResponseEntity.ok(ResponseWrapper.success(
                moduleRouteService.getAllModuleRoutes(active, moduleId, page, pageSize)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseWrapper<ModuleRouteResponse>> getModuleRouteById(@PathVariable UUID id) {
        return ResponseEntity.ok(ResponseWrapper.success(moduleRouteService.getModuleRouteById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseWrapper<ModuleRouteResponse>> updateModuleRoute(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<UpdateModuleRouteRequest> request) {
        return ResponseEntity.ok(ResponseWrapper.success(
                moduleRouteService.updateModuleRoute(id, request.getData())));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResponseWrapper<MessageResponse>> updateModuleRouteStatus(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<UpdateModuleRouteStatusRequest> request) {
        return ResponseEntity
                .ok(ResponseWrapper.success(moduleRouteService.updateModuleRouteStatus(id, request.getData())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseWrapper<MessageResponse>> deleteModuleRoute(@PathVariable UUID id) {
        return ResponseEntity.ok(ResponseWrapper.success(moduleRouteService.deleteModuleRoute(id)));
    }

    @GetMapping("/internal/routes")
    public List<ModuleRouteResponse> getActiveRoutes() {
        return moduleRouteService.getActiveRoutes();
    }
}
