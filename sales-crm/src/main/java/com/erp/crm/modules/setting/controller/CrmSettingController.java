package com.erp.crm.modules.setting.controller;

import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.setting.entity.*;
import com.erp.crm.modules.setting.service.CrmSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm/settings")
@RequiredArgsConstructor
@Tag(name = "CRM Settings & Master Data", description = "Endpoints for Tenant Operations, Lead Statuses, Sources & Custom Fields")
public class CrmSettingController {

    private final CrmSettingService settingService;

    @GetMapping("/company")
    @Operation(summary = "Get Company CRM Operational Settings")
    public ResponseEntity<ApiResponse<CrmCompanySetting>> getCompanySetting(
            @RequestParam(required = false) UUID companyId) {
        CrmCompanySetting setting = settingService.getCompanySetting(companyId);
        return ResponseEntity.ok(ApiResponse.success(setting));
    }

    @PutMapping("/company")
    @Operation(summary = "Update Company CRM Operational Settings")
    public ResponseEntity<ApiResponse<CrmCompanySetting>> updateCompanySetting(
            @RequestBody CrmCompanySetting setting,
            @RequestParam(required = false) UUID companyId) {
        CrmCompanySetting updated = settingService.updateCompanySetting(setting, companyId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Company settings updated successfully"));
    }

    @GetMapping("/lead-statuses")
    @Operation(summary = "List Lead Lifecycle Statuses")
    public ResponseEntity<ApiResponse<List<CrmLeadStatus>>> getLeadStatuses(
            @RequestParam(required = false) UUID companyId) {
        List<CrmLeadStatus> list = settingService.getLeadStatuses(companyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/lead-sources")
    @Operation(summary = "List Acquisition Sources")
    public ResponseEntity<ApiResponse<List<CrmLeadSource>>> getLeadSources(
            @RequestParam(required = false) UUID companyId) {
        List<CrmLeadSource> list = settingService.getLeadSources(companyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/lost-reasons")
    @Operation(summary = "List Standard Lost Reasons")
    public ResponseEntity<ApiResponse<List<CrmLostReason>>> getLostReasons(
            @RequestParam(required = false) UUID companyId) {
        List<CrmLostReason> list = settingService.getLostReasons(companyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/tags")
    @Operation(summary = "List Tenant Tags")
    public ResponseEntity<ApiResponse<List<CrmTag>>> getTags(
            @RequestParam(required = false) UUID companyId) {
        List<CrmTag> list = settingService.getTags(companyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/tags")
    @Operation(summary = "Create Tenant Tag")
    public ResponseEntity<ApiResponse<CrmTag>> createTag(
            @RequestParam String tagName,
            @RequestParam(required = false) String colorCode,
            @RequestParam(required = false) UUID companyId) {
        CrmTag tag = settingService.createTag(tagName, colorCode, companyId);
        return ResponseEntity.ok(ApiResponse.success(tag, "Tag created successfully"));
    }
}

