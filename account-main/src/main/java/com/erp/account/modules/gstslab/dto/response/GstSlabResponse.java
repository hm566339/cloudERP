package com.erp.account.modules.gstslab.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GstSlabResponse extends BaseResponseDto  {

    private UUID id;

    private String slabName;
    private BigDecimal cgstRate;
    private BigDecimal sgstRate;
    private BigDecimal igstRate;
    private BigDecimal cessRate;
    private LocalDate effectiveFrom;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
