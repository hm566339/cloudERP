package com.erp.crm.modules.integration.entity;

import com.erp.crm.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "crm_lead_import_batch")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLeadImportBatch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_storage_url", nullable = false, length = 500)
    private String fileStorageUrl;

    @Builder.Default
    @Column(name = "total_records", nullable = false)
    private Integer totalRecords = 0;

    @Builder.Default
    @Column(name = "imported_count", nullable = false)
    private Integer importedCount = 0;

    @Builder.Default
    @Column(name = "duplicate_count", nullable = false)
    private Integer duplicateCount = 0;

    @Builder.Default
    @Column(name = "failed_count", nullable = false)
    private Integer failedCount = 0;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING";

    @Column(name = "mapping_config_json", nullable = false, columnDefinition = "text")
    private String mappingConfigJson;

    @Column(name = "error_report_url", length = 500)
    private String errorReportUrl;
}

