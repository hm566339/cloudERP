package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalInfoDto implements Serializable {
    private String approvalStatus;
    private Integer approvalLevel;
    private String approvedBy;
    private LocalDateTime approvedDate;
    private String approvalRemarks;
    private List<WorkflowHistoryDto> workflowHistory;
}
