package com.erp.crm.modules.automation.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.automation.enums.AutomationTrigger;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.util.UUID;

@Entity
@Table(name = "crm_automation_rule", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_auto_rule_code", columnNames = {"company_id", "rule_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmAutomationRule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rule_name", nullable = false, length = 150)
    private String ruleName;

    @Column(name = "rule_code", nullable = false, length = 100)
    private String ruleCode;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
        @Column(name = "trigger_event", nullable = false)
    private AutomationTrigger triggerEvent;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "filter_conditions_json", nullable = false, columnDefinition = "text")
    private String filterConditionsJson;

    @Builder.Default
    @Column(name = "execution_order", nullable = false)
    private Integer executionOrder = 10;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
