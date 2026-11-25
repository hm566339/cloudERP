package com.erp.communication.security.sso;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private AccountStatus accountStatus;
    private String companyCode;
    private UUID organizationId;
    private String organizationCode;
    private String accessMode;
    private List<RoleResponse> role;
}
