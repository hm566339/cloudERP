package com.erp.crm.modules.lead.dto.request;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadConvertRequest {

    @Builder.Default
    private Boolean createAccount = true;

    private String accountName;

    @Builder.Default
    private Boolean createOpportunity = true;

    private String opportunityName;

    private UUID pipelineId;

    private UUID stageId;

    private BigDecimal dealValue;

    private LocalDate expectedCloseDate;
}

