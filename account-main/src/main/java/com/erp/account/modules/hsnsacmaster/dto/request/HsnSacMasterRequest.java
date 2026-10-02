package com.erp.account.modules.hsnsacmaster.dto.request;

import com.erp.account.enums.HsnSacType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request object for HSN / SAC master records")
public class HsnSacMasterRequest implements Serializable {

    @Size(min = 4, max = 20, message = "HSN/SAC code must be between 4 and 20 characters")
    @Pattern(regexp = "^[A-Za-z0-9\\-]+$", message = "HSN/SAC code must contain only letters, numbers, or hyphens")
    @Schema(description = "HSN or SAC code (optional for create API, auto-generated if omitted)")
    private String code;

    @NotBlank(message = "Description is required")
    @Size(max = 255, message = "Description must not exceed 255 characters")
    @Schema(description = "Product or service description", requiredMode = Schema.RequiredMode.REQUIRED)
    private String description;

    @NotNull(message = "HSN/SAC type is required")
    @Schema(description = "HSN or SAC type", requiredMode = Schema.RequiredMode.REQUIRED)
    private HsnSacType type;

    @NotNull(message = "GST slab is required")
    @Schema(description = "GST slab ID mapped to the HSN/SAC", requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID gstSlabId;
}
