package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
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
public class CompanyAccessRequest {
    @NotNull private UUID companyId;
    private UUID roleId;
    private List<UUID> roleIds;
}
