package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentInfoDto implements Serializable {
    private UUID departmentId;
    private String departmentCode;
    private String departmentName;
    private UUID branchId;
    private String branchName;
}
