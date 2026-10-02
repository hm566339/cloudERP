package com.erp.account.modules.gst.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Enterprise Create Request DTO for GST State Code.
 * Used exclusively for POST /api/account/gst/master/states
 * wrapped inside RequestWrapper<CreateGstStateRequest>.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Payload to create a new GST State Master record")
public class CreateGstStateRequest {

    @NotBlank(message = "State Code is required")
    @Size(min = 2, max = 2, message = "State code must be exactly 2 characters")
    @Pattern(regexp = "\\d{2}", message = "State code must be a 2-digit numeric value (e.g. 27)")
    @Schema(description = "2-digit numeric GST State Code", example = "27", required = true)
    private String stateCode;

    @NotBlank(message = "State Name is required")
    @Size(max = 100, message = "State name cannot exceed 100 characters")
    @Schema(description = "Full name of the state", example = "Maharashtra", required = true)
    private String stateName;

    @Size(max = 10, message = "Short name cannot exceed 10 characters")
    @Schema(description = "Short abbreviation of the state name", example = "MH")
    private String shortName;

    @Size(max = 10, message = "ISO state code cannot exceed 10 characters")
    @Schema(description = "ISO 3166-2 state code", example = "IN-MH")
    private String isoStateCode;

    @Schema(description = "UUID of the linked country record", example = "a3e4f123-...")
    private UUID countryId;

    @Size(max = 100, message = "Capital city cannot exceed 100 characters")
    @Schema(description = "Capital city of the state", example = "Mumbai")
    private String capitalCity;

    @Size(max = 50, message = "Region cannot exceed 50 characters")
    @Schema(description = "Geographic region", example = "West")
    private String region;

    @Size(max = 50, message = "Timezone cannot exceed 50 characters")
    @Schema(description = "Timezone identifier", example = "Asia/Kolkata")
    private String timeZone;

    @Size(max = 3, message = "Currency code cannot exceed 3 characters")
    @Schema(description = "ISO 4217 currency code", example = "INR")
    private String currencyCode;

    @Size(max = 50, message = "Currency name cannot exceed 50 characters")
    @Schema(description = "Full currency name", example = "Indian Rupee")
    private String currencyName;

    @Schema(description = "Whether this state is a Union Territory", example = "false")
    private boolean unionTerritory;

    @Schema(description = "Whether GST Registration is allowed for this state", example = "true")
    private Boolean gstRegistrationAllowed;

    @Size(max = 100, message = "Default place of supply cannot exceed 100 characters")
    @Schema(description = "Default place of supply for interstate transactions", example = "Maharashtra")
    private String defaultPlaceOfSupply;

    @Schema(description = "Whether Reverse Charge is applicable for this state", example = "false")
    private Boolean reverseChargeApplicable;

    @Schema(description = "Whether this state record is active", example = "true")
    private Boolean active;
}
