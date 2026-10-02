package com.erp.account.modules.auth.dto.ssoresponse;

import com.erp.account.modules.common.dto.BaseResponseDto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse extends BaseResponseDto  {

    private UUID id;
    private String name;
    private boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
