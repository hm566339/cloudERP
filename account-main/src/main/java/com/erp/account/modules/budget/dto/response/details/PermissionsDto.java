package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionsDto implements Serializable {
    private Boolean canEdit;
    private Boolean canDelete;
    private Boolean canApprove;
    private Boolean canExport;
    private Boolean canUpdateUtilization;
}
