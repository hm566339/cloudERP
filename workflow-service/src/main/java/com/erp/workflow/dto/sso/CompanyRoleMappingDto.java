package com.erp.workflow.dto.sso;

import lombok.*;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyRoleMappingDto {
    private UUID companyId;
    private String companyCode;
    private String companyName;
    @Builder.Default
    private Map<String, UUID> roleNameToIdMap = Collections.emptyMap();
}

