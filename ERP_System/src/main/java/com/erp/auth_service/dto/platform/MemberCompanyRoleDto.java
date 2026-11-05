package com.erp.auth_service.dto.platform;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberCompanyRoleDto {
    private UUID companyId;
    private String companyName;
    private String companyCode;
    private UUID roleId;
    private String roleName;
    private boolean active;
}

