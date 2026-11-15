package com.erp.crm.modules.automation.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.automation.dto.AutomationRuleRequest;
import com.erp.crm.modules.automation.dto.AutomationRuleResponse;
import com.erp.crm.modules.automation.dto.RoundRobinPoolRequest;
import com.erp.crm.modules.automation.dto.RoundRobinPoolResponse;
import com.erp.crm.modules.automation.entity.CrmAutomationExecutionLog;
import com.erp.crm.modules.automation.service.CrmAutomationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm/automation")
@RequiredArgsConstructor
@Tag(name = "Automation & Round-Robin", description = "Endpoints for Configuration-Driven Automation Rules, SpEL Triggers & Sales Rep Distribution")
public class CrmAutomationController {

    private final CrmAutomationService automationService;

    // --- Automation Rules ---

    @GetMapping("/rules")
    @Operation(summary = "List Automation Rules")
    public ResponseEntity<ApiResponse<List<AutomationRuleResponse>>> getRules(
            @RequestParam(required = false) UUID companyId) {
        List<AutomationRuleResponse> list = automationService.getAllRules(companyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/rules")
    @Operation(summary = "Create Automation Rule with Actions")
    public ResponseEntity<ApiResponse<AutomationRuleResponse>> createRule(
            @RequestBody @Valid ApiRequest<AutomationRuleRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        AutomationRuleResponse response = automationService.createRule(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Automation rule created successfully"));
    }

    @GetMapping("/rules/{id}")
    @Operation(summary = "Get Automation Rule by ID")
    public ResponseEntity<ApiResponse<AutomationRuleResponse>> getRuleById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        AutomationRuleResponse response = automationService.getRuleById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/rules/{id}")
    @Operation(summary = "Update Automation Rule")
    public ResponseEntity<ApiResponse<AutomationRuleResponse>> updateRule(
            @PathVariable UUID id,
            @RequestBody @Valid ApiRequest<AutomationRuleRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        AutomationRuleResponse response = automationService.updateRule(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Automation rule updated successfully"));
    }

    @DeleteMapping("/rules/{id}")
    @Operation(summary = "Delete Automation Rule")
    public ResponseEntity<ApiResponse<Void>> deleteRule(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        automationService.deleteRule(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("Automation rule deleted successfully"));
    }

    // --- Round Robin Pools ---

    @GetMapping("/round-robin-pools")
    @Operation(summary = "List Round-Robin Lead Assignment Pools")
    public ResponseEntity<ApiResponse<List<RoundRobinPoolResponse>>> getPools(
            @RequestParam(required = false) UUID companyId) {
        List<RoundRobinPoolResponse> list = automationService.getAllPools(companyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/round-robin-pools")
    @Operation(summary = "Create Round-Robin Lead Assignment Pool with Members")
    public ResponseEntity<ApiResponse<RoundRobinPoolResponse>> createPool(
            @RequestBody @Valid ApiRequest<RoundRobinPoolRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        RoundRobinPoolResponse response = automationService.createPool(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Round-robin pool created successfully"));
    }

    @GetMapping("/round-robin-pools/{id}")
    @Operation(summary = "Get Round-Robin Pool by ID")
    public ResponseEntity<ApiResponse<RoundRobinPoolResponse>> getPoolById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        RoundRobinPoolResponse response = automationService.getPoolById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/round-robin-pools/{id}")
    @Operation(summary = "Update Round-Robin Pool")
    public ResponseEntity<ApiResponse<RoundRobinPoolResponse>> updatePool(
            @PathVariable UUID id,
            @RequestBody @Valid ApiRequest<RoundRobinPoolRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        RoundRobinPoolResponse response = automationService.updatePool(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Round-robin pool updated successfully"));
    }

    @DeleteMapping("/round-robin-pools/{id}")
    @Operation(summary = "Delete Round-Robin Pool")
    public ResponseEntity<ApiResponse<Void>> deletePool(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        automationService.deletePool(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("Round-robin pool deleted successfully"));
    }

    // --- Execution Logs ---

    @GetMapping("/logs")
    @Operation(summary = "List Automation Execution Audit Logs")
    public ResponseEntity<ApiResponse<List<CrmAutomationExecutionLog>>> getLogs(
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<CrmAutomationExecutionLog> page = automationService.getExecutionLogs(companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Execution logs fetched successfully"));
    }
}

