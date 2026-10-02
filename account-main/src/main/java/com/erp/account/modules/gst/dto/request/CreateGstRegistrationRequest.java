package com.erp.account.modules.gst.dto.request;

import com.erp.account.modules.gst.enums.GstRegistrationType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Enterprise Create Request DTO for GST Registration.
 * Used exclusively for POST /api/account/gst/master/registrations
 * wrapped inside RequestWrapper<CreateGstRegistrationRequest>.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Payload to create a new GST Registration record")
public class CreateGstRegistrationRequest {

    @NotNull(message = "Company ID is required")
    @Schema(description = "UUID of the company this registration belongs to", required = true)
    private UUID companyId;

    @Schema(description = "UUID of the branch (optional, for branch-level registration)")
    private UUID branchId;

    @NotBlank(message = "GSTIN is required")
    @Size(min = 15, max = 15, message = "GSTIN must be exactly 15 characters")
    @Pattern(
        regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
        message = "GSTIN format is invalid. Expected format: 27AAAAA0000A1Z5"
    )
    @Schema(description = "15-character GSTIN as per Indian GST format", example = "27AAAAA0000A1Z5", required = true)
    private String gstin;

    @Size(min = 10, max = 10, message = "PAN must be exactly 10 characters")
    @Pattern(
        regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
        message = "PAN format is invalid. Expected format: AAAAA0000A"
    )
    @Schema(description = "10-character PAN of the entity", example = "AAAAA0000A")
    private String pan;

    @NotNull(message = "Registration type is required")
    @Schema(description = "Type of GST Registration (e.g. REGULAR, COMPOSITION, UNREGISTERED)", required = true)
    private GstRegistrationType registrationType;

    @NotNull(message = "Registered date is required")
    @PastOrPresent(message = "Registered date cannot be a future date")
    @Schema(description = "Date on which GST was registered (cannot be future)", example = "2023-04-01", required = true)
    private LocalDate registeredDate;

    @NotBlank(message = "Legal name is required")
    @Size(max = 255, message = "Legal name cannot exceed 255 characters")
    @Schema(description = "Registered legal name of the entity", example = "Acme Pvt Ltd", required = true)
    private String legalName;

    @Size(max = 255, message = "Trade name cannot exceed 255 characters")
    @Schema(description = "Trade name (if different from legal name)", example = "Acme Solutions")
    private String tradeName;

    @NotNull(message = "State Code ID is required")
    @Schema(description = "UUID of the GST State Code record", required = true)
    private UUID stateCodeId;

    @Schema(description = "Whether this is the default registration for the company", example = "false")
    private boolean isDefault;
}
