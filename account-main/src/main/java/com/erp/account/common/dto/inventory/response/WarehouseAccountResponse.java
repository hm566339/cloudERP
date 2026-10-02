package com.erp.account.common.dto.inventory.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WarehouseAccountResponse
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseAccountResponse extends BaseResponseDto  {

    private UUID warehouseId;
    private UUID warehouseLocation;
    private String warehouseName;
    private String warehouseLocationName;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long version;

}
