package com.erp.auth_service.mapper;

import com.erp.auth_service.dto.request.CreateUserRequest;
import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.model.*;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    // =========================
    // DTO → ENTITY
    // =========================
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "emailStatus", ignore = true)
    @Mapping(target = "accountStatus", ignore = true)
    @Mapping(target = "failedLoginCount", ignore = true)
    @Mapping(target = "lockedUntil", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)

    // relations ignore
    @Mapping(target = "portalAccesses", ignore = true)
    @Mapping(target = "sessions", ignore = true)
    @Mapping(target = "authorizationCodes", ignore = true)
    @Mapping(target = "userRoles", ignore = true)
    @Mapping(target = "tokens", ignore = true)
    User toEntity(CreateUserRequest request);

    // =========================
    // ENTITY → RESPONSE
    // =========================
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyCode", source = "company.companyCode")
    @Mapping(target = "organizationId", source = "company.organization.id")
    @Mapping(target = "organizationCode", source = "company.organization.organizationCode")
    @Mapping(target = "accessMode", source = "company.organization.accessMode")
    @Mapping(target = "role", source = "userRoles")
    @Mapping(target = "portalAccess", source = "portalAccesses")
    @Mapping(target = "session", source = "sessions")
    UserResponse toResponse(User user);

    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "updatedAt")
    List<UserResponse> toResponseList(List<User> users);

    // =========================
    // NESTED MAPPINGS
    // =========================

    // UserRole → RoleResponse
    @Mapping(target = "id", source = "role.id")
    @Mapping(target = "name", source = "role.name")
    @Mapping(target = "status", source = "role.status")
    @Mapping(target = "createdAt", source = "role.createdAt")
    @Mapping(target = "updatedAt", source = "role.updatedAt")
    RoleResponse toRoleResponse(UserRole userRole);

    List<RoleResponse> toRoleResponseList(List<UserRole> userRoles);

    // UserPortalAccess → Response
    @Mapping(target = "id", source = "id")
    @Mapping(target = "companyModuleId", source = "companyModule.id")
    @Mapping(target = "moduleId", source = "companyModule.module.id")
    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "moduleName", source = "companyModule.module.name")
    @Mapping(target = "host", source = "companyModule.module.host")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "updatedAt")
    UserPortalAccessResponse toUserPortalAccessResponse(UserPortalAccess access);

    List<UserPortalAccessResponse> toUserPortalAccessResponseList(List<UserPortalAccess> accesses);

    // =========================
    // DEFAULT VALUES
    // =========================
    @AfterMapping
    default void setDefaults(@MappingTarget User user) {
        if (user.getEmailStatus() == null) {
            user.setEmailStatus(Status.UNVERIFIED);
        }
        if (user.getAccountStatus() == null) {
            user.setAccountStatus(AccountStatus.INACTIVE);
        }
        if (user.getFailedLoginCount() == null) {
            user.setFailedLoginCount(0);
        }
    }

    // =========================
    // PATCH UPDATE
    // =========================
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserFromDto(CreateUserRequest request, @MappingTarget User user);
}