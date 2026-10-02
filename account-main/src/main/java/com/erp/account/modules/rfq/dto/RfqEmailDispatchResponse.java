package com.erp.account.modules.rfq.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RfqEmailDispatchResponse {
    private UUID rfqId;
    private String rfqNumber;
    private int emailsSentCount;
    private int emailsFailedCount;
    private int vendorsWithoutEmail;
    private boolean emailSent;
    private List<RfqEmailVendorResult> vendors;
}
