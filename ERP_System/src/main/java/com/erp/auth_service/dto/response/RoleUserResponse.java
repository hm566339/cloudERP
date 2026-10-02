package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class RoleUserResponse {
    private UUID id;
    private String empId;
    private String username;
    private String email;
    private String fullName;
    private String accountStatus;
}