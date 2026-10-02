package com.erp.account.modules.gstslab.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GstSlabFilterDto {


    private String searchKey;
    
    private String slabName;
    
    private Boolean isDeleted;
    
    private BigDecimal minTotalRate;
    private BigDecimal maxTotalRate;
    
    private LocalDate effectiveFromStart;
    private LocalDate effectiveFromEnd;
    
    private LocalDate createdFrom;
    private LocalDate createdTo;
    
    private LocalDate updatedFrom;
    private LocalDate updatedTo;
}
