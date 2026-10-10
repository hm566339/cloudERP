package com.erp.auth_service.mapper;

import com.erp.auth_service.dto.request.GrantAccessRequest;
import com.erp.auth_service.dto.response.UserPortalAccessResponse;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserPortalAccess;

import org.mapstruct.*;

import java.time.LocalDateTime;
import java.util.List;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface UserPortalAccessMapper {

    /*
     * CREATE ENTITY
     */
    default UserPortalAccess toUserPortalAccess(
            GrantAccessRequest request,
            User user,
            CompanyModule companyModule
    ) {

        if (request == null) {
            return null;
        }

        return UserPortalAccess.builder()
                .user(user)
                .companyModule(companyModule)
                .status(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    /*
     * ENTITY -> RESPONSE DTO
     */
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

    /*
     * LIST MAPPING
     */
    List<UserPortalAccessResponse> toUserPortalAccessResponseList(
            List<UserPortalAccess> accesses
    );
}