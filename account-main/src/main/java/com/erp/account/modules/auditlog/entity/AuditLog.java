package com.erp.account.modules.auditlog.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;


@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_log_company", columnList = "company_id"),
        @Index(name = "idx_audit_log_entity", columnList = "entity_name"),
        @Index(name = "idx_audit_log_user", columnList = "performed_by")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AuditLog extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    @JsonIgnore
    private Company company;

    @JsonProperty("companyId")
    public UUID getCompanyId() {
        return company != null ? company.getId() : null;
    }

    @Column(name = "module_name")
    private String moduleName;

    @Column(name = "entity_name")
    private String entityName;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "action_type")
    private String actionType;

    @Column(name = "old_value", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode oldValue;

    @Column(name = "new_value", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode newValue;

    @Column(name = "performed_by")
    private UUID performedBy;

    @Column(name = "performed_by_username")
    private String performedByUsername;

    @Column(name = "performed_at")
    private LocalDateTime performedAt;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;
}


