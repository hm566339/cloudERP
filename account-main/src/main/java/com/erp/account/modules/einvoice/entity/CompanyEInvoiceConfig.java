package com.erp.account.modules.einvoice.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.einvoice.enums.EInvoiceProviderType;
import com.erp.account.modules.gst.entity.GstRegistration;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "company_einvoice_config", uniqueConstraints = {
        @UniqueConstraint(name = "uq_company_einvoice_gstin", columnNames = {"company_id", "gst_registration_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyEInvoiceConfig extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "gst_registration_id", nullable = false)
    private UUID gstRegistrationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gst_registration_id", insertable = false, updatable = false)
    private GstRegistration gstRegistration;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_name", nullable = false, length = 50)
    @Builder.Default
    private EInvoiceProviderType providerName = EInvoiceProviderType.MOCK;

    @Column(name = "environment", nullable = false, length = 20)
    @Builder.Default
    private String environment = "SANDBOX";

    @Column(name = "client_id")
    private String clientId;

    @Column(name = "encrypted_client_secret", columnDefinition = "TEXT")
    private String encryptedClientSecret;

    @Column(name = "portal_username", length = 100)
    private String portalUsername;

    @Column(name = "encrypted_portal_password", columnDefinition = "TEXT")
    private String encryptedPortalPassword;

    @Column(name = "encrypted_auth_token", columnDefinition = "TEXT")
    private String encryptedAuthToken;

    @Column(name = "encrypted_sek", columnDefinition = "TEXT")
    private String encryptedSek;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Column(name = "auto_generate_on_approval", nullable = false)
    @Builder.Default
    private Boolean autoGenerateOnApproval = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
