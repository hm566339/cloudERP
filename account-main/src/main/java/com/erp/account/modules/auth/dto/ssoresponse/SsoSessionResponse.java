package com.erp.account.modules.auth.dto.ssoresponse;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SsoSessionResponse extends BaseResponseDto  {


    private UUID id;
    private String username;
    private String ipAddress;
    private String userAgent;
    private UUID moduleId;
    private String moduleName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime accessTokenValidTill;
}