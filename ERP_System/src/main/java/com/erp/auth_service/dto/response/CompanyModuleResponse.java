package com.erp.auth_service.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.UserPortalAccess;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyModuleResponse {

    private UUID id;
    private CompanyResponse company;

    private ModuleResponse module;
    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}