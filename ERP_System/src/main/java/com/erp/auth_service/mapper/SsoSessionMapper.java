package com.erp.auth_service.mapper;

import com.erp.auth_service.dto.response.AuthorizationCodeResponse;
import com.erp.auth_service.dto.response.RefreshTokenResponse;
import com.erp.auth_service.dto.response.SsoSessionResponse;
import com.erp.auth_service.dto.response.UserDto;
import com.erp.auth_service.model.AuthorizationCode;
import com.erp.auth_service.model.Session;
import com.erp.auth_service.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SsoSessionMapper {

    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "module.name", target = "moduleName")
    @Mapping(source = "module.id", target = "moduleId")
    @Mapping(source = "createdAt", target = "createdAt")
    @Mapping(source = "updatedAt", target = "updatedAt")
    SsoSessionResponse toResponse(Session session);

    List<SsoSessionResponse> toResponseList(List<Session> sessions);

    RefreshTokenResponse toRefreshTokenResponse(Session session);

    UserDto toUserDto(User user);

    AuthorizationCodeResponse toAuthCodeResponse(AuthorizationCode code);

}