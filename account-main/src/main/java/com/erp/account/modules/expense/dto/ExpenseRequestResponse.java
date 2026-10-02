package com.erp.account.modules.expense.dto;

import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExpenseRequestResponse {

    private UUID id;
    private UUID companyId;
    private String requestNumber;
    private RequestType requestType;
    private LocalDate date;
    private UUID requesterId;
    private UUID employeeDriverId;
    private String employeeName;
    private RoleType roleType;
    private UUID categoryId;
    private String categoryName;
    private BigDecimal requestedAmount;
    private BigDecimal approvedAmount;
    private BigDecimal usedAmount;
    private BigDecimal remainingAmount;
    private String purposeDescription;
    private String additionalNotes;
    private ExpenseRequestStatus status;
    private ExpenseRequestStatus approvalStatus;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private UUID rejectedBy;
    private LocalDateTime rejectedAt;
    private Boolean requiresAdvance;
    private BigDecimal advanceAmount;
    private UUID salesOrderId;
    private UUID deliveryChallanId;
    private UUID vehicleId;
    private String vehicleNumber;
    private UUID claimId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
}
