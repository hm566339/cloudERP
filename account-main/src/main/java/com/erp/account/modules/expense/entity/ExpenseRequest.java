package com.erp.account.modules.expense.entity;

import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "expense_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseRequest extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "request_number", nullable = false, length = 50)
    private String requestNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 30)
    private RequestType requestType;

    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;

    @Column(name = "requester_id", nullable = false)
    private UUID requesterId;

    @Column(name = "employee_driver_id", nullable = false)
    private UUID employeeDriverId;

    @Column(name = "employee_name")
    private String employeeName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false, length = 20)
    private RoleType roleType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_category_id", nullable = false)
    private ExpenseCategory expenseCategory;

    @Column(name = "requested_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal requestedAmount;

    @Column(name = "purpose_description", columnDefinition = "TEXT")
    private String purposeDescription;

    @Column(name = "additional_notes", columnDefinition = "TEXT")
    private String additionalNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ExpenseRequestStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 30)
    private ExpenseRequestStatus approvalStatus;

    @Column(name = "approved_amount", precision = 19, scale = 4)
    private BigDecimal approvedAmount;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "rejected_by")
    private UUID rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "requires_advance")
    @Builder.Default
    private Boolean requiresAdvance = false;

    @Column(name = "advance_amount", precision = 19, scale = 4)
    private BigDecimal advanceAmount;

    @Column(name = "sales_order_id")
    private UUID salesOrderId;

    @Column(name = "delivery_challan_id")
    private UUID deliveryChallanId;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "vehicle_number", length = 50)
    private String vehicleNumber;

    @Column(name = "claim_id")
    private UUID claimId;
}
