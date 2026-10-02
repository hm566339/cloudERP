package com.erp.account.modules.reporting.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class ProfitLossRequest {
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fromDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate toDate;

    private UUID companyId;

    private UUID branchId;
    private UUID departmentId;
    private UUID projectId;
    private UUID costCenterId;
    private UUID accountId;
    private String accountType;
    private UUID ledgerGroupId;
    private String voucherType;
    private String currency;
    private String status;

    private Boolean includeZeroBalance = false;
    private Boolean includeOpeningBalance = false;
    private Boolean includeClosingBalance = false;
    private Boolean includeSubAccounts = false;

    private String groupBy;
    private String sortBy;
    private String sortDirection;
    private String search;

    private Boolean export = false;
    private String exportFormat;

    private int page = 0;
    private int pageSize = 50;
}
