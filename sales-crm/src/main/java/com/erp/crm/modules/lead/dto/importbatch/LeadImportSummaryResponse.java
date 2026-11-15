package com.erp.crm.modules.lead.dto.importbatch;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadImportSummaryResponse {
    private UUID batchId;
    private UUID companyId;
    private String fileName;
    private Integer totalRecords;
    private Integer importedCount;
    private Integer duplicateCount;
    private Integer failedCount;
    private String status;
    private String errorReportUrl;
    private LocalDateTime createdAt;
    private List<RowErrorDetail> errors;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RowErrorDetail {
        private int rowNumber;
        private String rawLine;
        private String reason;
    }
}

