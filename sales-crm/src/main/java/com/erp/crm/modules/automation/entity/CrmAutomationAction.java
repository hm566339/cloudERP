package com.erp.crm.modules.automation.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.automation.enums.AutomationActionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.util.UUID;

@Entity
@Table(name = "crm_automation_action")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmAutomationAction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rule_id", nullable = false)
    private UUID ruleId;

    @Builder.Default
    @Column(name = "action_order", nullable = false)
    private Integer actionOrder = 1;

    @Enumerated(EnumType.STRING)
        @Column(name = "action_type", nullable = false)
    private AutomationActionType actionType;

    @Column(name = "action_payload_json", nullable = false, columnDefinition = "text")
    private String actionPayloadJson;

    @Builder.Default
    @Column(name = "delay_minutes", nullable = false)
    private Integer delayMinutes = 0;
}
