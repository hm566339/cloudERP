package com.erp.account.modules.einvoice.dto;

import com.erp.account.modules.einvoice.enums.EInvoiceProviderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyEInvoiceConfigDto {

    private UUID id;
    private UUID companyId;
    private UUID gstRegistrationId;
    private String gstin;
    private EInvoiceProviderType providerName;
    private String environment; // SANDBOX, PRODUCTION
    private String clientId;
    private String portalUsername;
    private boolean hasClientSecret;
    private boolean hasPortalPassword;
    private boolean autoGenerateOnApproval;
    private boolean isActive;
    private LocalDateTime tokenExpiresAt;

    // Write-only fields for saving credentials - Never returned in API responses
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private String clientSecret;

    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private String portalPassword;
}

