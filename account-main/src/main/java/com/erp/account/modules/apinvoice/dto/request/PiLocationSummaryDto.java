package com.erp.account.modules.apinvoice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiLocationSummaryDto {
    private UUID locationId;
    private String locationName;
}
