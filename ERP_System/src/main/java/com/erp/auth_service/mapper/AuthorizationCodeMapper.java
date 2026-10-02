package com.erp.auth_service.mapper;

import com.erp.auth_service.dto.response.AuthorizationCodeResponse;
import com.erp.auth_service.model.AuthorizationCode;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AuthorizationCodeMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "moduleId", source = "module.id")
    @Mapping(target = "code", source = "code")
    @Mapping(target = "used", source = "used")
    AuthorizationCodeResponse toAuthorizationCodeResponse(AuthorizationCode code);

    List<AuthorizationCodeResponse> toAuthorizationCodeResponseList(List<AuthorizationCode> codes);
}