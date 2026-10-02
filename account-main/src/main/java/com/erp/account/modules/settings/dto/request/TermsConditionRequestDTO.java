package com.erp.account.modules.settings.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TermsConditionRequestDTO implements Serializable {

    @NotBlank(message = "Title is mandatory")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String content;

    private Boolean isDefault;

    private Boolean isActive;

    @jakarta.validation.constraints.NotNull(message = "Document Type is mandatory")
    private com.erp.account.modules.common.enums.SalesDocumentType documentType;
}
