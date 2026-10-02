package com.erp.account.modules.expense.dto;

import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
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
public class ExpenseRequestUpdateRequest {

    private RequestType requestType;

    @JsonAlias({"date", "requestDate"})
    private LocalDate date;

    @JsonAlias({"employeeDriverId", "employeeId", "driverId"})
    private UUID employeeDriverId;

    private RoleType roleType;

    @JsonAlias({"categoryId", "expenseCategoryId"})
    private UUID categoryId;

    @DecimalMin(value = "0.01", message = "Requested amount must be greater than zero")
    private BigDecimal requestedAmount;

    private String purposeDescription;

    private String additionalNotes;

    private Boolean requiresAdvance;

    private BigDecimal advanceAmount;

    private UUID salesOrderId;

    private UUID deliveryChallanId;

    private UUID vehicleId;

    private String vehicleNumber;
}
