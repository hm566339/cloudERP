package com.erp.auth_service.dto.request;

import com.erp.auth_service.utility.MemberType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
public class InviteMemberRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "Invalid email format")
    private String email;

    private String fullName;

    private String employeeId;

    private String empId;

    private String username;

    private MemberType memberType;

    private UUID organizationId;

    private UUID companyId;

    private UUID roleId;

    private List<UUID> roleIds;

    public String getEffectiveEmployeeId() {
        if (employeeId != null && !employeeId.isBlank()) {
            return employeeId.trim();
        }
        if (empId != null && !empId.isBlank()) {
            return empId.trim();
        }
        return null;
    }
}

