package com.erp.workflow.dto.request;

import com.erp.workflow.enums.PlatformRolloutMode;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolloutPlatformTemplateRequest {

    @NotNull(message = "rolloutMode is required (NEW_ORGS_ONLY, NON_CUSTOMIZED, FORCE_ALL)")
    private PlatformRolloutMode rolloutMode;

    /** Optional targeted organization IDs. If null or empty, targets all organizations */
    private List<UUID> targetOrganizationIds;

    /** If true, propagate changes down to all child companies under targeted organizations */
    @Builder.Default
    private Boolean propagateToCompanies = true;

    private String comment;
}

