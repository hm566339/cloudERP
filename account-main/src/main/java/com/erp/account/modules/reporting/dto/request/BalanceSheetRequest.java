package com.erp.account.modules.reporting.dto.request;


import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;


@Data
public class BalanceSheetRequest {
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fromDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate toDate;

    private java.util.UUID companyId;

    private java.util.UUID branchId;
    private java.util.UUID departmentId;
    private java.util.UUID projectId;
    private java.util.UUID costCenterId;
    private java.util.UUID warehouseId;
    private java.util.UUID accountId;
    private String accountType;
    private java.util.UUID accountGroupId;
    private String currency;
    private String status;
    private Boolean includeZeroBalance = false;
    private Boolean includeOpeningBalance = false;
    private Boolean includeClosingBalance = false;
    private Boolean includeSubAccounts = false;
    private Boolean includeInactiveAccounts = false;
    private String groupBy;
    private String hierarchyLevel;
    private String search;
    private String sortBy;
    private String sortDirection;
    private Boolean compareWithPreviousPeriod = false;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate previousPeriodFromDate;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate previousPeriodToDate;
    private Boolean export = false;
    private String exportFormat;

    private int page = 0;
    private int pageSize = 50;
}
