package com.erp.auth_service.dto.platform;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportSessionContextResponse {

    @Builder.Default
    private String principalType = "PLATFORM_SUPPORT";

    private UUID supportSessionId;
    private UUID platformAdminId;
    private String platformAdminEmail;
    private UUID organizationId;
    private String organizationName;
    private String organizationCode;
    private UUID companyId;
    private String companyName;
    private String companyCode;
    private UUID moduleId;
    private String moduleCode;
    private String moduleName;
    private String reason;
    private long remainingSeconds;
    private boolean active;
}
