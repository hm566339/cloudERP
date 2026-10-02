package com.erp.account.modules.apinvoice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiWarehouseSummaryDto {
    private UUID warehouseId;
    private String warehouseName;
    private List<PiLocationSummaryDto> locations;
}
