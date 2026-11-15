package com.erp.crm.modules.setting.entity;

import com.erp.crm.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_custom_field_value", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_cf_val_field_entity", columnNames = {"custom_field_id", "entity_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmCustomFieldValue extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "custom_field_id", nullable = false)
    private UUID customFieldId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "value_text", columnDefinition = "text")
    private String valueText;

    @Column(name = "value_number")
    private Long valueNumber;

    @Column(name = "value_decimal", precision = 19, scale = 4)
    private BigDecimal valueDecimal;

    @Column(name = "value_date")
    private LocalDateTime valueDate;

    @Column(name = "value_json", columnDefinition = "text")
    private String valueJson;
}

