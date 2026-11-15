package com.erp.crm.modules.lead.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.lead.enums.LeadRating;
import com.erp.crm.modules.lead.enums.LeadStage;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_lead", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_lead_company_code", columnNames = {"company_id", "lead_code"}),
        @UniqueConstraint(name = "uq_crm_lead_company_id", columnNames = {"company_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLead extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "lead_code", nullable = false, length = 50)
    private String leadCode;

    @Column(name = "salutation", length = 20)
    private String salutation;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "normalized_email", length = 255)
    private String normalizedEmail;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "normalized_phone", length = 20)
    private String normalizedPhone;

    @Column(name = "alternate_phone", length = 30)
    private String alternatePhone;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "organization_name", length = 255)
    private String organizationName;

    @Column(name = "designation", length = 100)
    private String designation;

    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "annual_revenue", precision = 19, scale = 4)
    private BigDecimal annualRevenue;

    @Column(name = "company_size", length = 50)
    private String companySize;

    @Column(name = "gstin", length = 15)
    private String gstin;

    @Column(name = "pan", length = 10)
    private String pan;

    @Column(name = "address_line1", length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "state_code", length = 10)
    private String stateCode;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Builder.Default
    @Column(name = "country", length = 100)
    private String country = "India";

    @Column(name = "lead_source_id")
    private UUID leadSourceId;

    @Column(name = "tenant_integration_id")
    private UUID tenantIntegrationId;

    @Column(name = "external_lead_id", length = 255)
    private String externalLeadId;

    @Column(name = "external_lead_url", length = 500)
    private String externalLeadUrl;

    @Column(name = "campaign_id")
    private UUID campaignId;

    @Column(name = "utm_source", length = 100)
    private String utmSource;

    @Column(name = "utm_medium", length = 100)
    private String utmMedium;

    @Column(name = "utm_campaign", length = 100)
    private String utmCampaign;

    @Column(name = "utm_content", length = 100)
    private String utmContent;

    @Column(name = "utm_term", length = 100)
    private String utmTerm;

    @Column(name = "raw_inquiry_text", columnDefinition = "text")
    private String rawInquiryText;

    @Column(name = "lead_status_id", nullable = false)
    private UUID leadStatusId;

    @Enumerated(EnumType.STRING)
        @Column(name = "lead_stage", nullable = false)
    @Builder.Default
    private LeadStage leadStage = LeadStage.RAW;

    @Builder.Default
    @Column(name = "lead_score", nullable = false)
    private Integer leadScore = 0;

    @Enumerated(EnumType.STRING)
        @Column(name = "score_grade")
    @Builder.Default
    private LeadRating scoreGrade = LeadRating.COLD;

    @Builder.Default
    @Column(name = "is_qualified", nullable = false)
    private Boolean isQualified = false;

    @Column(name = "qualified_at")
    private LocalDateTime qualifiedAt;

    @Column(name = "qualified_by_user_id")
    private UUID qualifiedByUserId;

    @Column(name = "owner_user_id")
    private UUID ownerUserId;

    @Column(name = "assigned_team_id")
    private UUID assignedTeamId;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "last_contacted_at")
    private LocalDateTime lastContactedAt;

    @Column(name = "next_follow_up_date")
    private LocalDateTime nextFollowUpDate;

    @Builder.Default
    @Column(name = "is_converted", nullable = false)
    private Boolean isConverted = false;

    @Column(name = "converted_at")
    private LocalDateTime convertedAt;

    @Column(name = "converted_by_user_id")
    private UUID convertedByUserId;

    @Column(name = "converted_account_id")
    private UUID convertedAccountId;

    @Column(name = "converted_contact_id")
    private UUID convertedContactId;

    @Column(name = "converted_opportunity_id")
    private UUID convertedOpportunityId;

    @Builder.Default
    @Column(name = "is_lost", nullable = false)
    private Boolean isLost = false;

    @Column(name = "lost_reason_id")
    private UUID lostReasonId;

    @Column(name = "lost_details", columnDefinition = "text")
    private String lostDetails;

    @Column(name = "lost_at")
    private LocalDateTime lostAt;

    @Builder.Default
    @Column(name = "is_recycled", nullable = false)
    private Boolean isRecycled = false;

    @Column(name = "recycled_at")
    private LocalDateTime recycledAt;

    @Builder.Default
    @Column(name = "is_duplicate", nullable = false)
    private Boolean isDuplicate = false;

    @Column(name = "primary_lead_id")
    private UUID primaryLeadId;

    @Column(name = "dedup_fingerprint", length = 64)
    private String dedupFingerprint;

    @Builder.Default
    @Column(name = "consent_given", nullable = false)
    private Boolean consentGiven = false;

    @Column(name = "consent_timestamp")
    private LocalDateTime consentTimestamp;

    @Column(name = "consent_source", length = 100)
    private String consentSource;

    @Builder.Default
    @Column(name = "opt_out_email", nullable = false)
    private Boolean optOutEmail = false;

    @Builder.Default
    @Column(name = "opt_out_whatsapp", nullable = false)
    private Boolean optOutWhatsapp = false;

    @Builder.Default
    @Column(name = "opt_out_sms", nullable = false)
    private Boolean optOutSms = false;

    @Builder.Default
    @Column(name = "opt_out_call", nullable = false)
    private Boolean optOutCall = false;
}
