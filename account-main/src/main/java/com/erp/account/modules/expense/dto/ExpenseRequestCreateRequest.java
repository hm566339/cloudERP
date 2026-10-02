package com.erp.account.modules.expense.dto;

import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class ExpenseRequestCreateRequest {

    @NotNull(message = "Request type is required")
    private RequestType requestType;

    @NotNull(message = "Request date is required")
    @JsonAlias({"date", "requestDate"})
    private LocalDate date;

    @NotNull(message = "Employee/Driver ID is required")
    @JsonAlias({"employeeDriverId", "employeeId", "driverId"})
    private UUID employeeDriverId;

    private String employeeName;

    @NotNull(message = "Role type is required")
    private RoleType roleType;

    @NotNull(message = "Category ID is required")
    @JsonAlias({"categoryId", "expenseCategoryId"})
    private UUID categoryId;

    @NotNull(message = "Requested amount is required")
    @DecimalMin(value = "0.01", message = "Requested amount must be greater than zero")
    private BigDecimal requestedAmount;

    private String purposeDescription;

    private String additionalNotes;

    @Builder.Default
    private Boolean requiresAdvance = false;

    private BigDecimal advanceAmount;

    private UUID salesOrderId;

    private UUID deliveryChallanId;

    private UUID vehicleId;

    private String vehicleNumber;
}
