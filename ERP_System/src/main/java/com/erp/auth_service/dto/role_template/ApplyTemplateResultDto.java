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
public class ApplyTemplateResultDto {
    private UUID templateId;
    private String templateName;
    private int createdCount;
    private int updatedCount;
    private int skippedCount;
    @Builder.Default
    private List<ApplyCompanyDetailDto> details = new ArrayList<>();
}

