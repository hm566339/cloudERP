package com.erp.account.modules.expense.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EmployeeExpenseRequestDetail {

    @JsonAlias({"id", "requestId"})
    private UUID expenseRequestId;

    private String requestNumber;

    private String categoryName;

    @JsonAlias({"purposeDescription", "purpose"})
    private String description;

    private BigDecimal requestedAmount;

    private BigDecimal approvedAmount;

    private BigDecimal usedAmount;

    private BigDecimal remainingAmount;

    /**
     * Alias getter to provide backwards-compatible 'id' attribute for frontend components
     */
    public UUID getId() {
        return expenseRequestId;
    }

    /**
     * Alias getter to provide backwards-compatible 'purposeDescription' attribute
     */
    public String getPurposeDescription() {
        return description;
    }
}
