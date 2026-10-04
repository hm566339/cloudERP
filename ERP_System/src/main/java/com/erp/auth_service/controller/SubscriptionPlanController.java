package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.AssignPlanModulesRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.request.SubscriptionPlanRequest;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.response.SubscriptionPlanResponse;
import com.erp.auth_service.service.SubscriptionPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/subscription-plans")
@RequiredArgsConstructor
public class SubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;

    @GetMapping
    public ResponseEntity<ResponseWrapper<List<SubscriptionPlanResponse>>> getAllPlans(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ResponseWrapper.success(subscriptionPlanService.getAllPlans(active, search)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseWrapper<SubscriptionPlanResponse>> getPlanById(@PathVariable UUID id) {
        return ResponseEntity.ok(ResponseWrapper.success(subscriptionPlanService.getPlanById(id)));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ResponseWrapper<SubscriptionPlanResponse>> getPlanByCode(@PathVariable String code) {
        return ResponseEntity.ok(ResponseWrapper.success(subscriptionPlanService.getPlanByCode(code)));
    }

    @PostMapping
    public ResponseEntity<ResponseWrapper<SubscriptionPlanResponse>> createPlan(
            @Valid @RequestBody RequestWrapper<SubscriptionPlanRequest> wrapper) {
        SubscriptionPlanRequest request = wrapper != null && wrapper.getData() != null ? wrapper.getData() : null;
        if (request == null) {
            throw new com.erp.auth_service.exception.BadRequestException("Request body cannot be null");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.success(subscriptionPlanService.createPlan(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseWrapper<SubscriptionPlanResponse>> updatePlan(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<SubscriptionPlanRequest> wrapper) {
        SubscriptionPlanRequest request = wrapper != null && wrapper.getData() != null ? wrapper.getData() : null;
        if (request == null) {
            throw new com.erp.auth_service.exception.BadRequestException("Request body cannot be null");
        }
        return ResponseEntity.ok(ResponseWrapper.success(subscriptionPlanService.updatePlan(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResponseWrapper<SubscriptionPlanResponse>> toggleStatus(
            @PathVariable UUID id,
            @RequestParam Boolean active) {
        return ResponseEntity.ok(ResponseWrapper.success(subscriptionPlanService.togglePlanStatus(id, active)));
    }

    @PutMapping("/{id}/modules")
    public ResponseEntity<ResponseWrapper<SubscriptionPlanResponse>> assignModules(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<AssignPlanModulesRequest> wrapper) {
        AssignPlanModulesRequest request = wrapper != null && wrapper.getData() != null ? wrapper.getData() : null;
        List<UUID> moduleIds = request != null ? request.getModuleIds() : List.of();
        return ResponseEntity.ok(ResponseWrapper.success(subscriptionPlanService.assignModulesToPlan(id, moduleIds)));
    }

    @DeleteMapping("/{id}/modules/{moduleId}")
    public ResponseEntity<ResponseWrapper<SubscriptionPlanResponse>> removeModule(
            @PathVariable UUID id,
            @PathVariable UUID moduleId) {
        return ResponseEntity.ok(ResponseWrapper.success(subscriptionPlanService.removeModuleFromPlan(id, moduleId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> deletePlan(@PathVariable UUID id) {
        subscriptionPlanService.deletePlan(id);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Subscription plan deactivated successfully")));
    }
}
