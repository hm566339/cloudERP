package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class CompanyAccessRequest {
    @NotNull private UUID companyId;
    private UUID roleId;
}
