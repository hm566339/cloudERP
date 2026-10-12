package com.erp.communication.event;

import com.erp.communication.dto.request.EmailAttachmentDto;
import com.erp.communication.template.TemplateCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailNotificationEvent implements Serializable {

    private UUID eventId;
    private UUID companyId;
    private TemplateCode templateCode;
    private String recipient;
    private String subject;
    private String htmlContent;
    private String plainTextContent;

    @Builder.Default
    private Map<String, Object> templateData = new HashMap<>();

    private String idempotencyKey;

    @Builder.Default
    private List<EmailAttachmentDto> attachments = new ArrayList<>();

    private String traceId;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
