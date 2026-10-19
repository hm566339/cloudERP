package com.erp.manufacturing.productionorder.controller;

import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.service.ProductionOrderService;
import com.erp.manufacturing.util.TenantUtils;
import com.erp.manufacturing.security.annotation.RequireFeature;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/manufacturing/production-orders")
@RequireFeature("MANUFACTURING")
@RequiredArgsConstructor
public class ProductionOrderController {

    private final ProductionOrderService productionOrderService;

    @GetMapping("/{id}")
    public ResponseEntity<ProductionOrder> getById(@PathVariable UUID id) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return productionOrderService.getByIdAndCompanyId(id, companyId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<ProductionOrder>> getAll() {
        return ResponseEntity.ok(productionOrderService.getAll());
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<ProductionOrder>> getAllByCompany(@PathVariable UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        return ResponseEntity.ok(productionOrderService.getAll());
    }

    @PostMapping
    public ResponseEntity<ProductionOrder> create(@jakarta.validation.Valid @RequestBody com.erp.manufacturing.productionorder.dto.request.ProductionOrderCreateRequest request) {
        return ResponseEntity.ok(productionOrderService.createOrder(request));
    }

    @PostMapping("/from-bom/{bomId}")
    public ResponseEntity<ProductionOrder> createFromBom(
            @PathVariable UUID bomId,
            @RequestParam(required = false) java.math.BigDecimal quantity,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(productionOrderService.createOrderFromBom(bomId, quantity, warehouseId, locationId, notes));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ProductionOrder> submit(@PathVariable UUID id, @RequestBody(required = false) Map<String, String> payload) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        String comments = payload != null ? payload.get("comments") : null;
        return ResponseEntity.ok(productionOrderService.submitForApproval(id, companyId, comments));
    }

    @PostMapping("/{id}/submit-for-approval")
    public ResponseEntity<ProductionOrder> submitForApproval(@PathVariable UUID id, @RequestBody(required = false) Map<String, String> payload) {
        return submit(id, payload);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ProductionOrder> approve(@PathVariable UUID id) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return ResponseEntity.ok(productionOrderService.approveOrder(id, companyId));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ProductionOrder> reject(@PathVariable UUID id, @RequestBody(required = false) Map<String, String> payload) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        String reason = payload != null ? payload.get("reason") : null;
        return ResponseEntity.ok(productionOrderService.rejectOrder(id, companyId, reason));
    }

    @PostMapping("/{id}/release")
    public ResponseEntity<ProductionOrder> release(@PathVariable UUID id) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return ResponseEntity.ok(productionOrderService.releaseOrder(id, companyId));
    }
}
