package com.erp.account.modules.hsnsacmaster.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.HsnSacType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HsnSacMasterResponse extends BaseResponseDto  {

    private UUID id;

    private String code;
    private String description;
    private HsnSacType type;

    private UUID gstSlabId;
    private String gstSlabName;
    private BigDecimal cgstRate;
    private BigDecimal sgstRate;
    private BigDecimal igstRate;
    private BigDecimal cessRate;

    private boolean deleted;
    private long itemMappingCount;
    private long invoiceUsageCount;
    private long taxTransactionCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
