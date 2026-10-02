package com.erp.account.modules.reporting.dto.request;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class ReportFilter {
    private LocalDate fromDate;
    private LocalDate toDate;
    private String fiscalYear;
    private UUID branchId;
    private UUID costCenterId;
    private UUID projectId;
    private String currency;
    private UUID accountId;
    private Integer page = 0;
    private Integer size = 200; // default page size for reports
    private UUID companyId;
}
