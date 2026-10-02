package com.erp.account.modules.settings.dto.request;

import com.erp.account.modules.common.enums.SalesDocumentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryTermRequestDTO {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    @Schema(description = "Name of the delivery term", example = "Ex-Works")
    private String name;

    @Schema(description = "Description of the delivery term", example = "Delivery within 15 days from order confirmation.")
    private String description;

    @NotNull(message = "Document type is required")
    @Schema(description = "Type of sales document this term applies to")
    private SalesDocumentType documentType;

    @Schema(description = "Is this the default term for the company and document type")
    private Boolean isDefault;

    @Schema(description = "Is this term active")
    private Boolean isActive;
}
