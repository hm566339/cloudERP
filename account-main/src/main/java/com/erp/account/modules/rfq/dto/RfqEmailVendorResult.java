package com.erp.account.modules.rfq.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RfqEmailVendorResult {
    private UUID vendorId;
    private String vendorName;
    private String email;
    private String status; // SENT, FAILED, NO_EMAIL
    private String error;
}
