package com.erp.auth_service.mapper;

import com.erp.auth_service.dto.request.CreateRoleRequest;
import com.erp.auth_service.dto.response.RoleResponse;
import com.erp.auth_service.dto.response.RoleUserResponse;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.UserRole;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RoleMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userRoles", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Role toRole(CreateRoleRequest request);

    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "updatedAt")
    RoleResponse toRoleResponse(Role role);

    List<RoleResponse> toRoleResponseList(List<Role> roles);

    @Mapping(target = "id", source = "user.id")
    @Mapping(target = "empId", source = "user.empId")
    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "fullName", source = "user.fullName")
    @Mapping(target = "accountStatus", source = "user.accountStatus")
    RoleUserResponse toRoleUserResponse(UserRole userRole);

    List<RoleUserResponse> toRoleUserResponseList(List<UserRole> userRoles);
}