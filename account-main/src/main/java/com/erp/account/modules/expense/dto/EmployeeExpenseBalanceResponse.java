package com.erp.account.modules.expense.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EmployeeExpenseBalanceResponse {

    private UUID employeeId;

    private String employeeName;

    @JsonProperty("employeeRole")
    @JsonAlias({"role", "employeeRole"})
    private String employeeRole;

    private BigDecimal totalRequestedAmount;

    private BigDecimal totalApprovedAmount;

    private BigDecimal totalUsedAmount;

    private BigDecimal totalRemainingAmount;

    @Builder.Default
    private List<EmployeeExpenseRequestDetail> requests = new ArrayList<>();

    @JsonProperty("role")
    public String getRole() {
        return employeeRole;
    }

    public void setRole(String role) {
        this.employeeRole = role;
    }
}
