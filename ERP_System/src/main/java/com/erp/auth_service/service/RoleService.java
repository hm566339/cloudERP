package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CreateRoleRequest;
import com.erp.auth_service.dto.response.RoleDetailsResponse;
import com.erp.auth_service.dto.response.RoleListResponse;
import com.erp.auth_service.dto.response.RoleResponse;

import java.util.UUID;

public interface RoleService {

     public RoleResponse createRole(
            UUID companyId,
            CreateRoleRequest request
    );

    // RoleListResponse getAllRoles(Boolean status, int page, int pageSize, String search);

    RoleDetailsResponse getRoleDetails(UUID roleId, int page, int pageSize, String search);

    RoleResponse updateRole(UUID roleId, CreateRoleRequest request);

    RoleResponse updateRoleStatus(UUID roleId, boolean status);

    void deleteRole(UUID roleId);

    RoleListResponse getAllRoles(UUID companyId, Boolean status, int page, int pageSize, String search);
}