package com.erp.account.modules.salesinvoice.dto;

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
public class SiWarehouseSummaryDto {
    private UUID warehouseId;
    private String warehouseName;
    private List<SiLocationSummaryDto> locations;
}
