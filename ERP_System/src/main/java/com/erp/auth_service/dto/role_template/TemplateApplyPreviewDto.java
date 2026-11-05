package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateApplyPreviewDto {
    private UUID templateId;
    private String templateName;
    @Builder.Default
    private List<CompanyTemplatePreviewItemDto> companies = new ArrayList<>();
}

