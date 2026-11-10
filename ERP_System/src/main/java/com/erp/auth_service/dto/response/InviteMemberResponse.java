package com.erp.auth_service.dto.response;

import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
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
public class InviteMemberResponse {
    private UUID memberId;
    private UUID userId;
    private UUID organizationId;
    private String email;
    private String username;
    private String fullName;
    private MemberType memberType;
    private MembershipStatus membershipStatus;
    private UUID companyId;
    private String message;
    private LocalDateTime invitedAt;
}

