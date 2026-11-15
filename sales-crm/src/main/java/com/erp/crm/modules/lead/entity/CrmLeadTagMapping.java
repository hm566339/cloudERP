package com.erp.crm.modules.lead.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "crm_lead_tag_mapping")
@IdClass(CrmLeadTagMapping.LeadTagId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLeadTagMapping {

    @Id
    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Id
    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Id
    @Column(name = "tag_id", nullable = false)
    private UUID tagId;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class LeadTagId implements Serializable {
        private UUID companyId;
        private UUID leadId;
        private UUID tagId;
    }
}

