package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.CreateModuleRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.request.UpdateModuleRequest;
import com.erp.auth_service.dto.request.UpdateModuleStatusRequest;
import com.erp.auth_service.dto.response.ModuleCreateResponse;
import com.erp.auth_service.dto.response.ModuleListResponse;
import com.erp.auth_service.dto.response.ModuleResponse;
import com.erp.auth_service.dto.response.ModuleStatusResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.response.RotateSecretResponse;
import com.erp.auth_service.dto.response.ModuleSummaryResponse;
import com.erp.auth_service.dto.response.MessageResponse;
import com.erp.auth_service.service.ModuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/sso/module")
@RequiredArgsConstructor
public class ModuleController {

        private final ModuleService moduleService;

        @PostMapping
        public ResponseEntity<ResponseWrapper<ModuleCreateResponse>> createModule(
                @Valid @RequestBody RequestWrapper<CreateModuleRequest> request,
                org.springframework.security.core.Authentication authentication) {
                assertSystemAdmin(authentication);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ResponseWrapper.success(moduleService.createModule(request.getData())));
        }

    @GetMapping
    public ResponseEntity<ResponseWrapper<ModuleListResponse>> getAllModules(
            @RequestParam(required = false) Boolean status,
            @RequestParam int page,
            @RequestParam int pageSize,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(
                ResponseWrapper.success(moduleService.getAllModules(status, page, pageSize, search))
        );
    }

        @GetMapping("/{id}")
        public ResponseEntity<ResponseWrapper<ModuleSummaryResponse>> getModuleById(@PathVariable UUID id) {
                return ResponseEntity.ok(ResponseWrapper.success(moduleService.getModuleById(id)));
        }

        @PutMapping("/{id}")
        public ResponseEntity<ResponseWrapper<ModuleResponse>> updateModule(
                        @PathVariable UUID id,
                        @Valid @RequestBody RequestWrapper<UpdateModuleRequest> request,
                        org.springframework.security.core.Authentication authentication) {
                assertSystemAdmin(authentication);
                return ResponseEntity.ok(ResponseWrapper.success(moduleService.updateModule(id, request.getData())));
        }

        @PatchMapping("/{id}/status")
        public ResponseEntity<ResponseWrapper<ModuleStatusResponse>> updateModuleStatus(
                        @PathVariable UUID id,
                        @Valid @RequestBody RequestWrapper<UpdateModuleStatusRequest> request,
                        org.springframework.security.core.Authentication authentication) {
                assertSystemAdmin(authentication);
                return ResponseEntity.ok(ResponseWrapper.success(moduleService.updateModuleStatus(id, request.getData())));
        }

        @PostMapping("/{id}/rotatesecret")
        public ResponseEntity<ResponseWrapper<RotateSecretResponse>> rotateSecret(
                        @PathVariable UUID id,
                        org.springframework.security.core.Authentication authentication) {
                assertSystemAdmin(authentication);
                return ResponseEntity.ok(ResponseWrapper.success(moduleService.rotateSecret(id)));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<ResponseWrapper<MessageResponse>> deleteModule(
                        @PathVariable UUID id,
                        org.springframework.security.core.Authentication authentication) {
                assertSystemAdmin(authentication);
                return ResponseEntity.ok(ResponseWrapper.success(moduleService.deleteModule(id)));
        }

        private void assertSystemAdmin(org.springframework.security.core.Authentication authentication) {
                if (com.erp.auth_service.security.PlatformSecurityUtil.isElevatedAdmin()) {
                        return;
                }
                if (authentication != null && authentication.getAuthorities() != null) {
                        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a ->
                                "SYSTEM_ADMIN".equalsIgnoreCase(a.getAuthority())
                                || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(a.getAuthority())
                                || "ROLE_SUPER_ADMIN".equalsIgnoreCase(a.getAuthority())
                                || "ROLE_PLATFORM_ADMIN".equalsIgnoreCase(a.getAuthority()));
                        if (isAdmin) {
                                return;
                        }
                }
                throw new com.erp.auth_service.exception.ForbiddenException("Access denied: Only SYSTEM_ADMIN is authorized to manage modules");
        }
}