package com.erp.account.modules.apinvoice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiApprovalWorkflowDto {
    private String approvalStatus;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private String approvalNotes;
    private List<String> workflowHistory;
}
