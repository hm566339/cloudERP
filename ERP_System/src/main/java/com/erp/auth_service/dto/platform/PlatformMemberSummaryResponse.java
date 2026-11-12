package com.erp.auth_service.dto.platform;

import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformMemberSummaryResponse {

    private UUID memberId;
    private UUID userId;
    private String email;
    private String username;
    private String fullName;
    private MemberType memberType;
    private MembershipStatus membershipStatus;
    private List<String> authorizedCompanies;
    private List<UUID> authorizedCompanyIds;
    private List<MemberCompanyRoleDto> companyAccess;
    private UUID defaultCompanyId;
    private String defaultCompanyName;
    private LocalDateTime createdAt;
}
