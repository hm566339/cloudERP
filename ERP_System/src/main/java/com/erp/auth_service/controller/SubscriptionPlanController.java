package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.AssignPlanModulesRequest;
import com.erp.auth_service.dto.request.SubscriptionPlanRequest;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.response.SubscriptionPlanResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.service.SubscriptionPlanService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/subscription-plans")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;
    private final ObjectMapper objectMapper;
    private final Validator validator;

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
            @RequestBody String rawBody) {
        SubscriptionPlanRequest request = parsePlanRequest(rawBody);
        validateRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.success(subscriptionPlanService.createPlan(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseWrapper<SubscriptionPlanResponse>> updatePlan(
            @PathVariable UUID id,
            @RequestBody String rawBody) {
        SubscriptionPlanRequest request = parsePlanRequest(rawBody);
        validateRequest(request);
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
            @RequestBody String rawBody) {
        List<UUID> moduleIds = parseModuleIds(rawBody);
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

    private SubscriptionPlanRequest parsePlanRequest(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            throw new BadRequestException("Request body cannot be empty");
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            if (root.has("data") && root.get("data").isObject()) {
                return objectMapper.treeToValue(root.get("data"), SubscriptionPlanRequest.class);
            }
            return objectMapper.treeToValue(root, SubscriptionPlanRequest.class);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid subscription plan payload: " + ex.getMessage());
        }
    }

    private List<UUID> parseModuleIds(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            return List.of();
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            JsonNode target = (root.has("data") && root.get("data").isObject()) ? root.get("data") : root;
            if (target.has("moduleIds") && target.get("moduleIds").isArray()) {
                List<UUID> ids = new ArrayList<>();
                for (JsonNode idNode : target.get("moduleIds")) {
                    ids.add(UUID.fromString(idNode.asText()));
                }
                return ids;
            }
            return List.of();
        } catch (Exception ex) {
            throw new BadRequestException("Invalid module assignment payload: " + ex.getMessage());
        }
    }

    private void validateRequest(SubscriptionPlanRequest request) {
        if (request == null) {
            throw new BadRequestException("Subscription plan request cannot be null");
        }
        if (validator != null) {
            Set<ConstraintViolation<SubscriptionPlanRequest>> violations = validator.validate(request);
            if (!violations.isEmpty()) {
                throw new BadRequestException(violations.iterator().next().getMessage());
            }
        }
    }
}
