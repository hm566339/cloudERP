package com.erp.crm.modules.setting.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.setting.enums.CustomFieldDataType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.util.UUID;

@Entity
@Table(name = "crm_custom_field_definition", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_cf_def_company_entity_key", columnNames = {"company_id", "entity_name", "field_key"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmCustomFieldDefinition extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entity_name", nullable = false, length = 50)
    private String entityName;

    @Column(name = "field_key", nullable = false, length = 50)
    private String fieldKey;

    @Column(name = "field_label", nullable = false, length = 100)
    private String fieldLabel;

    @Enumerated(EnumType.STRING)
        @Column(name = "data_type", nullable = false)
    @Builder.Default
    private CustomFieldDataType dataType = CustomFieldDataType.TEXT;

    @Column(name = "options_json", columnDefinition = "text")
    private String optionsJson;

    @Column(name = "default_value", columnDefinition = "text")
    private String defaultValue;

    @Builder.Default
    @Column(name = "is_required", nullable = false)
    private Boolean isRequired = false;

    @Builder.Default
    @Column(name = "is_searchable", nullable = false)
    private Boolean isSearchable = false;

    @Column(name = "validation_regex", length = 255)
    private String validationRegex;

    @Builder.Default
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
