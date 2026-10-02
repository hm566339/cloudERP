package com.erp.account.modules.settings.dto.response;

import com.erp.account.modules.common.enums.SalesDocumentType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryTermResponseDTO {

    @Schema(description = "Delivery term ID")
    private UUID id;

    @Schema(description = "Name of the delivery term")
    private String name;

    @Schema(description = "Description of the delivery term")
    private String description;

    @Schema(description = "Type of sales document this term applies to")
    private SalesDocumentType documentType;

    @Schema(description = "Is this the default term for the company and document type")
    private Boolean isDefault;

    @Schema(description = "Is this term active")
    private Boolean isActive;
}
