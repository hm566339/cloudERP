package com.erp.account.modules.fiscalyear.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FiscalYearFilterDto {

    private String searchKey;
    
    private String fiscalYearName;

    private UUID companyId;
    
    private Boolean isClosed;
    
    private LocalDate startDateFrom;
    private LocalDate startDateTo;
    
    private LocalDate endDateFrom;
    private LocalDate endDateTo;
    
    private LocalDate createdFrom;
    private LocalDate createdTo;
    
    private LocalDate updatedFrom;
    private LocalDate updatedTo;
}
