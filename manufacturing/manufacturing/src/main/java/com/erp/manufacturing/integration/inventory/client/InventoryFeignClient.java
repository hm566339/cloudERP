package com.erp.manufacturing.integration.inventory.client;

import com.erp.manufacturing.integration.inventory.config.FeignClientConfig;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiRequest;
import com.erp.manufacturing.integration.inventory.dto.ProductInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductUomInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductStockInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ReservationInventoryRequest;
import com.erp.manufacturing.integration.inventory.dto.ReservationInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.UnitOfMeasureInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.WarehouseInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.WarehouseLocationInventoryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;
import java.util.List;

@FeignClient(name = "inventoryFeignClient", url = "${service.api.inventory:http://localhost:8082}", configuration = FeignClientConfig.class)
public interface InventoryFeignClient {

    @GetMapping("/api/inventory/products/{id}")
    ResponseEntity<InventoryApiResponse<ProductInventoryResponse>> getProductById(
            @PathVariable("id") UUID id,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @GetMapping("/api/inventory/unit-of-measures/{id}")
    ResponseEntity<InventoryApiResponse<UnitOfMeasureInventoryResponse>> getUnitOfMeasureById(
            @PathVariable("id") UUID id,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @GetMapping("/api/inventory/product-uoms")
    ResponseEntity<InventoryApiResponse<List<ProductUomInventoryResponse>>> getProductUoms(
            @RequestParam(value = "productId", required = false) UUID productId,
            @RequestParam(value = "uomId", required = false) UUID uomId,
            @RequestParam(value = "companyId", required = false) UUID companyId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "1") int size);

    @GetMapping("/api/inventory/warehouses/{id}")
    ResponseEntity<InventoryApiResponse<WarehouseInventoryResponse>> getWarehouseById(
            @PathVariable("id") UUID id,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @GetMapping("/api/inventory/warehouse-locations/{id}")
    ResponseEntity<InventoryApiResponse<WarehouseLocationInventoryResponse>> getLocationById(
            @PathVariable("id") UUID id,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @GetMapping("/api/inventory/integration/stock/products")
    ResponseEntity<InventoryApiResponse<List<ProductStockInventoryResponse>>> getGroupedStock(
            @RequestParam(value = "companyId", required = false) UUID companyId,
            @RequestParam(value = "productId", required = false) UUID productId,
            @RequestParam(value = "search", required = false) String search);

    @org.springframework.web.bind.annotation.PostMapping("/api/inventory/stock-reservations")
    ResponseEntity<InventoryApiResponse<ReservationInventoryResponse>> createReservation(
            @RequestBody InventoryApiRequest<ReservationInventoryRequest> request,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @org.springframework.web.bind.annotation.PostMapping("/api/inventory/stock-reservations/{id}/release")
    ResponseEntity<InventoryApiResponse<ReservationInventoryResponse>> releaseReservation(
            @PathVariable("id") UUID id,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @org.springframework.web.bind.annotation.PostMapping("/api/inventory/integration/production/stock-out")
    ResponseEntity<InventoryApiResponse<com.erp.manufacturing.integration.inventory.dto.ProductionStockOutInventoryResponse>> createProductionStockOut(
            @RequestBody InventoryApiRequest<com.erp.manufacturing.integration.inventory.dto.ProductionStockOutInventoryRequest> request,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @org.springframework.web.bind.annotation.PostMapping("/api/inventory/integration/production/stock-in")
    ResponseEntity<InventoryApiResponse<com.erp.manufacturing.integration.inventory.dto.ProductionStockInInventoryResponse>> createProductionStockIn(
            @RequestBody InventoryApiRequest<com.erp.manufacturing.integration.inventory.dto.ProductionStockInInventoryRequest> request,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @org.springframework.web.bind.annotation.GetMapping("/api/inventory/integration/production/stock-out/{inventoryMovementId}/cost")
    ResponseEntity<InventoryApiResponse<com.erp.manufacturing.integration.inventory.dto.ProductionStockOutCostInventoryResponse>> getProductionStockOutCost(
            @PathVariable("inventoryMovementId") UUID inventoryMovementId,
            @RequestParam UUID productionOrderId,
            @RequestParam UUID productionOrderMaterialId,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @org.springframework.web.bind.annotation.PostMapping("/api/inventory/integration/production/stock-in-costed")
    ResponseEntity<InventoryApiResponse<com.erp.manufacturing.integration.inventory.dto.ProductionStockInCostedInventoryResponse>> createCostedProductionStockIn(
            @RequestBody InventoryApiRequest<com.erp.manufacturing.integration.inventory.dto.ProductionStockInCostedInventoryRequest> request,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @GetMapping("/api/inventory/stock-reservations/by-idempotency/{idempotencyKey}")
    ResponseEntity<InventoryApiResponse<ReservationInventoryResponse>> getReservationByIdempotencyKey(
            @PathVariable("idempotencyKey") UUID idempotencyKey,
            @RequestParam(value = "companyId", required = false) UUID companyId);

    @GetMapping("/api/inventory/integration/production/movements/by-idempotency/{idempotencyKey}")
    ResponseEntity<InventoryApiResponse<com.erp.manufacturing.integration.inventory.dto.ProductionStockOutInventoryResponse>> getMovementByIdempotencyKey(
            @PathVariable("idempotencyKey") UUID idempotencyKey,
            @RequestParam(value = "companyId", required = false) UUID companyId);
}
