package com.erp.account.modules.expense.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExpenseClaimItemResponse {

    private UUID id;
    private UUID expenseCategoryId;
    private String categoryName;
    private LocalDate expenseDate;
    private String description;
    private BigDecimal amount;
    private String billAttachmentUrl;
    
    private com.erp.account.enums.PaymentType paymentType;
}
