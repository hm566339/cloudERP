package com.erp.crm.modules.lead.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadConvertResponse {

    private UUID leadId;
    private String leadCode;
    private UUID accountId;
    private String accountCode;
    private UUID contactId;
    private String contactCode;
    private UUID opportunityId;
    private String opportunityCode;
}

