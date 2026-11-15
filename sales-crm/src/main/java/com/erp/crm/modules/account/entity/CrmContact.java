package com.erp.crm.modules.account.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.account.enums.DecisionMakerRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.util.UUID;

@Entity
@Table(name = "crm_contact", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_contact_company_code", columnNames = {"company_id", "contact_code"}),
        @UniqueConstraint(name = "uq_crm_contact_company_id", columnNames = {"company_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmContact extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "contact_code", nullable = false, length = 50)
    private String contactCode;

    @Column(name = "salutation", length = 20)
    private String salutation;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @Column(name = "designation", length = 100)
    private String designation;

    @Column(name = "department_name", length = 100)
    private String departmentName;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "normalized_email", length = 255)
    private String normalizedEmail;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "normalized_phone", length = 20)
    private String normalizedPhone;

    @Column(name = "mobile", length = 30)
    private String mobile;

    @Builder.Default
    @Column(name = "is_primary_contact", nullable = false)
    private Boolean isPrimaryContact = false;

    @Enumerated(EnumType.STRING)
        @Column(name = "decision_maker_role")
    @Builder.Default
    private DecisionMakerRole decisionMakerRole = DecisionMakerRole.EVALUATOR;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "owner_user_id")
    private UUID ownerUserId;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "consent_given", nullable = false)
    private Boolean consentGiven = false;

    @Builder.Default
    @Column(name = "opt_out_email", nullable = false)
    private Boolean optOutEmail = false;

    @Builder.Default
    @Column(name = "opt_out_whatsapp", nullable = false)
    private Boolean optOutWhatsapp = false;

    @Builder.Default
    @Column(name = "opt_out_sms", nullable = false)
    private Boolean optOutSms = false;
}
