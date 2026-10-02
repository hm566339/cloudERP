package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.CreateRoleRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.response.RoleDetailsResponse;
import com.erp.auth_service.dto.response.RoleListResponse;
import com.erp.auth_service.dto.response.RoleResponse;
import com.erp.auth_service.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/role")
@RequiredArgsConstructor
public class RoleController {

        private final RoleService roleService;

        // POST /role
        @PostMapping
        public ResponseEntity<ResponseWrapper<RoleResponse>> createRole(
                        @Valid @RequestBody RequestWrapper<CreateRoleRequest> request,
                        @Param("companyId") UUID companyId) {
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ResponseWrapper.success(roleService.createRole(companyId, request.getData())));
        }

        // GET /role
        @GetMapping
        public ResponseEntity<ResponseWrapper<RoleListResponse>> getAllRoles(
                @RequestParam(required = false) Boolean status,
                @RequestParam int page,
                @RequestParam int pageSize,
                @RequestParam(required = false) String search,
                @RequestParam("companyId") UUID companyId
        ) {
            return ResponseEntity.ok(
                    ResponseWrapper.success(roleService.getAllRoles(companyId, status, page, pageSize, search))
            );
        }

        // GET /role/:id
        @GetMapping("/{id}")
        public ResponseEntity<ResponseWrapper<RoleDetailsResponse>> getRoleDetails(
                @PathVariable UUID id,
                @RequestParam int page,
                @RequestParam int pageSize,
                @RequestParam(required = false) String search,
                @RequestParam(required = false) Boolean status
        ) {
                return ResponseEntity.ok(ResponseWrapper.success(roleService.getRoleDetails(id, page, pageSize, search)));
        }

        // PUT /role/:id
        @PutMapping("/{id}")
        public ResponseEntity<ResponseWrapper<RoleResponse>> updateRole(
                        @PathVariable UUID id,
                        @Valid @RequestBody RequestWrapper<CreateRoleRequest> request) {
                return ResponseEntity.ok(ResponseWrapper.success(roleService.updateRole(id, request.getData())));
        }

        // PATCH /role/:id/status
        @PatchMapping("/{id}/status")
        public ResponseEntity<ResponseWrapper<RoleResponse>> updateRoleStatus(
                        @PathVariable UUID id,
                        @RequestParam boolean status) {
                return ResponseEntity.ok(ResponseWrapper.success(roleService.updateRoleStatus(id, status)));
        }

        // DELETE /role/:id
        @DeleteMapping("/{id}")
        public ResponseEntity<ResponseWrapper<Object>> deleteRole(@PathVariable UUID id) {
                roleService.deleteRole(id);
                return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Role deleted")));
        }
}