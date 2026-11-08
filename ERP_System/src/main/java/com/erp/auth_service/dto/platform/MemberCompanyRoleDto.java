package com.erp.auth_service.dto.platform;

import lombok.*;
import java.util.List;
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
    
    // Primary / first role for backward compatibility
    private UUID roleId;
    private String roleName;

    // Multi-role support
    @Builder.Default
    private List<UUID> roleIds = List.of();

    @Builder.Default
    private List<String> roleNames = List.of();

    private boolean active;
}
