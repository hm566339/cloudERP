package com.erp.account.modules.auth.dto.ssoresponse;

import com.erp.account.modules.common.dto.BaseResponseDto;

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
public class UserPortalAccessResponse extends BaseResponseDto  {
    private UUID id;
    private String username;
    private String moduleName;
    private String host;
    private Boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}