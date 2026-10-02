package com.erp.account.modules.quotation.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QtApprovalWorkflowDto {
    private String approvalStatus;
    private java.util.UUID approvedBy;
    private java.time.LocalDateTime approvedAt;
}
