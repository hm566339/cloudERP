package com.erp.crm.modules.lead.service;

import com.erp.crm.modules.integration.entity.CrmLeadImportBatch;
import com.erp.crm.modules.lead.dto.importbatch.LeadImportSummaryResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface CrmLeadImportService {

    LeadImportSummaryResponse importLeadsCsv(MultipartFile file, UUID companyId);
    List<CrmLeadImportBatch> getImportBatches(UUID companyId);
    CrmLeadImportBatch getBatchById(UUID batchId, UUID companyId);
}

