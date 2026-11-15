package com.erp.crm.modules.lead.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.integration.entity.CrmLeadImportBatch;
import com.erp.crm.modules.lead.dto.importbatch.LeadImportSummaryResponse;
import com.erp.crm.modules.lead.dto.request.*;
import com.erp.crm.modules.lead.dto.response.LeadConvertResponse;
import com.erp.crm.modules.lead.dto.response.LeadResponse;
import com.erp.crm.modules.lead.service.CrmLeadImportService;
import com.erp.crm.modules.lead.service.CrmLeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm/leads")
@RequiredArgsConstructor
@Tag(name = "Lead Management", description = "Endpoints for Lead Lifecycle, Qualification, Assignment & Conversion")
public class CrmLeadController {

    private final CrmLeadService leadService;
    private final CrmLeadImportService leadImportService;

    @PostMapping
    @Operation(summary = "Create Lead (Manual Entry)")
    public ResponseEntity<ApiResponse<LeadResponse>> createLead(
            @RequestBody @Valid ApiRequest<LeadCreateRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        LeadResponse response = leadService.createLead(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Lead created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Lead Details by ID")
    public ResponseEntity<ApiResponse<LeadResponse>> getLeadById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        LeadResponse response = leadService.getLeadById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "List Leads (Paginated & Filtered)")
    public ResponseEntity<ApiResponse<List<LeadResponse>>> getAllLeads(
            LeadFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<LeadResponse> page = leadService.getAllLeads(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Leads fetched successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Lead Details")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLead(
            @PathVariable UUID id,
            @RequestBody @Valid ApiRequest<LeadUpdateRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        LeadResponse response = leadService.updateLead(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lead updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update Lead Status & Lifecycle Stage")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLeadStatus(
            @PathVariable UUID id,
            @RequestBody @Valid ApiRequest<LeadStatusUpdateRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        LeadResponse response = leadService.updateLeadStatus(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lead status updated successfully"));
    }

    @PostMapping("/{id}/assign")
    @Operation(summary = "Reassign Lead Ownership")
    public ResponseEntity<ApiResponse<LeadResponse>> assignLead(
            @PathVariable UUID id,
            @RequestBody @Valid ApiRequest<LeadAssignRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        LeadResponse response = leadService.assignLead(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lead reassigned successfully"));
    }

    @PostMapping("/merge")
    @Operation(summary = "Merge Duplicate Leads")
    public ResponseEntity<ApiResponse<LeadResponse>> mergeLeads(
            @RequestBody @Valid ApiRequest<LeadMergeRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        LeadResponse response = leadService.mergeLeads(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Leads merged successfully"));
    }

    @PostMapping("/{id}/convert")
    @Operation(summary = "Convert Qualified Lead to Account, Contact & Opportunity")
    public ResponseEntity<ApiResponse<LeadConvertResponse>> convertLead(
            @PathVariable UUID id,
            @RequestBody @Valid ApiRequest<LeadConvertRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        LeadConvertResponse response = leadService.convertLead(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lead converted successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Lead (Soft Delete)")
    public ResponseEntity<ApiResponse<Void>> deleteLead(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        leadService.deleteLead(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("Lead deleted successfully"));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload CSV Batch for Bulk Lead Import")
    public ResponseEntity<ApiResponse<LeadImportSummaryResponse>> importLeadsCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) UUID companyId) {
        LeadImportSummaryResponse response = leadImportService.importLeadsCsv(file, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "CSV lead import batch processed"));
    }

    @GetMapping("/import/batches")
    @Operation(summary = "List Company CSV Import Batches")
    public ResponseEntity<ApiResponse<List<CrmLeadImportBatch>>> getImportBatches(
            @RequestParam(required = false) UUID companyId) {
        List<CrmLeadImportBatch> list = leadImportService.getImportBatches(companyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/import/batches/{id}")
    @Operation(summary = "Get CSV Import Batch Details by ID")
    public ResponseEntity<ApiResponse<CrmLeadImportBatch>> getImportBatchById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        CrmLeadImportBatch batch = leadImportService.getBatchById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(batch));
    }
}

