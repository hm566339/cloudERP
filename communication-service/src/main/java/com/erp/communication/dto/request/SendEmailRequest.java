package com.erp.communication.dto.request;

import com.erp.communication.template.TemplateCode;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendEmailRequest {

    @NotNull(message = "companyId is required")
    private UUID companyId;

    private TemplateCode templateCode;

    @NotBlank(message = "recipient is required")
    @Email(message = "recipient must be a valid email address")
    private String recipient;

    private String subject;

    private String htmlContent;

    private String plainTextContent;

    @Builder.Default
    private Map<String, Object> templateData = new HashMap<>();

    private String idempotencyKey;

    @Builder.Default
    private List<EmailAttachmentDto> attachments = new ArrayList<>();

    @Builder.Default
    private Boolean async = false;
}
