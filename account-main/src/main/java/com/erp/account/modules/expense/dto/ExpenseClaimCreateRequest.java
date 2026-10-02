package com.erp.account.modules.expense.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseClaimCreateRequest {

    @NotNull(message = "Employee ID is required")
    @JsonAlias({ "employeeId", "employeeDriverId" })
    private UUID employeeId;

    @NotNull(message = "Employee name is required")
    @JsonAlias({ "employeeName", "name" })
    private String employeeName;

    @NotNull(message = "Employee role is required")
    @JsonAlias({ "employeeRole", "role" })
    private String employeeRole;

    @NotNull(message = "Claim date is required")
    @JsonAlias({ "claimDate", "date" })
    private LocalDate claimDate;

    @JsonAlias({ "expenseRequestId", "requestId" })
    private UUID expenseRequestId;

    @NotEmpty(message = "At least one expense item is required")
    @Valid
    private List<ExpenseClaimItemRequest> items;
}
