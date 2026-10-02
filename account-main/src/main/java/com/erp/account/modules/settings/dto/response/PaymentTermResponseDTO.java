package com.erp.account.modules.settings.dto.response;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTermResponseDTO implements Serializable {

    private UUID id;
    private String name;
    private String description;
    private Boolean isDefault;
    private Boolean isActive;
    private com.erp.account.modules.common.enums.SalesDocumentType documentType;
}
