package com.erp.crm.modules.setting.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.automation.enums.RoundRobinStrategy;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "crm_company_setting")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmCompanySetting extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "default_pipeline_id")
    private UUID defaultPipelineId;

    @Column(name = "default_lead_source_id")
    private UUID defaultLeadSourceId;

    @Builder.Default
    @Column(name = "auto_assign_leads", nullable = false)
    private Boolean autoAssignLeads = true;

    @Enumerated(EnumType.STRING)
        @Column(name = "round_robin_strategy", nullable = false)
    @Builder.Default
    private RoundRobinStrategy roundRobinStrategy = RoundRobinStrategy.ROUND_ROBIN;

    @Builder.Default
    @Column(name = "quotation_validity_days", nullable = false)
    private Integer quotationValidityDays = 30;

    @Builder.Default
    @Column(name = "require_discount_approval", nullable = false)
    private Boolean requireDiscountApproval = true;

    @Builder.Default
    @Column(name = "discount_approval_threshold", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountApprovalThreshold = new BigDecimal("15.00");

    @Builder.Default
    @Column(name = "enable_deduplication", nullable = false)
    private Boolean enableDeduplication = true;

    @Builder.Default
    @Column(name = "dedup_match_fields")
    private String dedupMatchFields = "PHONE,EMAIL";

    @Builder.Default
    @Column(name = "base_currency", nullable = false, length = 3)
    private String baseCurrency = "INR";

    @Column(name = "business_hours_start")
    private LocalTime businessHoursStart;

    @Column(name = "business_hours_end")
    private LocalTime businessHoursEnd;

    @Builder.Default
    @Column(name = "working_days", length = 50)
    private String workingDays = "MON,TUE,WED,THU,FRI,SAT";

    @Builder.Default
    @Column(name = "sla_first_response_hours")
    private Integer slaFirstResponseHours = 4;

    @Builder.Default
    @Column(name = "enable_ai_scoring", nullable = false)
    private Boolean enableAiScoring = false;
}
