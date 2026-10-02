package com.erp.account.modules.expense.dto;

import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseRequestFilterDto {
    private String search;
    private ExpenseRequestStatus status;
    private ExpenseRequestStatus approvalStatus;
    private Boolean availableForExpense;
    private Boolean consolidated;
    private RequestType requestType;
    private RoleType roleType;
    private UUID employeeDriverId;
    private UUID categoryId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateTo;

    private UUID salesOrderId;
    private UUID deliveryChallanId;
}
