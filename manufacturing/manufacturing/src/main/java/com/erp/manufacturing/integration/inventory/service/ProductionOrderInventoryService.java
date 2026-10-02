package com.erp.manufacturing.integration.inventory.service;

import com.erp.manufacturing.common.enums.ProductionMaterialStatus;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.common.exception.ExternalServiceException;
import com.erp.manufacturing.common.exception.ResourceNotFoundException;
import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiRequest;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.integration.inventory.dto.LocationStockInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.MaterialAvailabilityResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductStockInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ReservationInventoryRequest;
import com.erp.manufacturing.integration.inventory.dto.ReservationInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.WarehouseStockInventoryResponse;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderMaterial;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.util.TenantUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductionOrderInventoryService {

    private static final String REFERENCE_TYPE = "PRODUCTION";

    private final ProductionOrderRepository productionOrderRepository;
    private final ProductionOrderMaterialRepository materialRepository;
    private final InventoryFeignClient inventoryFeignClient;
    private final ManufacturingOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<MaterialAvailabilityResponse> getMaterialAvailability(UUID productionOrderId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        ProductionOrder order = loadOrder(productionOrderId, companyId);
        ensureAvailabilityState(order);

        return materialRepository.findAllByProductionOrderIdAndCompanyId(productionOrderId, companyId).stream()
                .map(material -> availabilityFor(material, order, companyId))
                .toList();
    }

    @Transactional
    public void reserve(UUID productionOrderId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        ProductionOrder order = loadOrder(productionOrderId, companyId);
        ensureReservableState(order);

        for (ProductionOrderMaterial material : materialRepository
                .findAllByProductionOrderIdAndCompanyId(productionOrderId, companyId)) {
            if (material.getInventoryReservationId() != null) {
                continue;
            }

            BigDecimal remainingRequired = remainingRequired(material);
            if (remainingRequired.signum() <= 0) {
                continue;
            }

            StockSnapshot stock = stockFor(material, order, companyId);
            BigDecimal reservationQuantity = remainingRequired.min(stock.availableQuantity());
            if (reservationQuantity.signum() <= 0 || stock.batchId() == null) {
                continue;
            }

            String idempotencyKey = reservationIdempotencyKey(companyId, productionOrderId, material.getId());
            Optional<ManufacturingOutbox> existingEvent = outboxRepository
                    .findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey);
            if (existingEvent.isPresent()) {
                continue;
            }

            ReservationInventoryRequest reservation = ReservationInventoryRequest.builder()
                    .reservationNo(idempotencyKey)
                    .productId(material.getComponentProductId())
                    .warehouseId(order.getWarehouseId())
                    .locationId(order.getProductionLocationId())
                    .batchId(stock.batchId())
                    .referenceType(REFERENCE_TYPE)
                    .referenceId(productionOrderId)
                    .referenceLineId(material.getId())
                    .reservedQuantity(reservationQuantity)
                    .releasedQuantity(BigDecimal.ZERO)
                    .build();

            ReservationInventoryResponse response = createReservation(reservation, companyId);
            BigDecimal actualReserved = response.getReservedQuantity();
            if (actualReserved == null || actualReserved.signum() <= 0) {
                throw new ExternalServiceException("Inventory returned no reserved quantity.");
            }

            BigDecimal newReserved = nonNull(material.getReservedQuantity()).add(actualReserved);
            material.setReservedQuantity(newReserved);
            material.setInventoryReservationId(response.getId());
            material.setStatus(newReserved.compareTo(requiredQuantity(material)) >= 0
                    ? ProductionMaterialStatus.RESERVED : ProductionMaterialStatus.PARTIALLY_RESERVED);
            materialRepository.save(material);
            saveReservationEvent(companyId, productionOrderId, material, reservation, response, idempotencyKey);
        }
    }

    @Transactional
    public void releaseReservations(UUID productionOrderId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        ProductionOrder order = loadOrder(productionOrderId, companyId);
        ensureReservableState(order);

        for (ProductionOrderMaterial material : materialRepository
                .findAllByProductionOrderIdAndCompanyId(productionOrderId, companyId)) {
            UUID reservationId = material.getInventoryReservationId();
            if (reservationId == null) {
                continue;
            }

            ReservationInventoryResponse response = releaseReservation(reservationId, companyId);
            BigDecimal released = response.getReleasedQuantity();
            if (released == null) {
                released = nonNull(material.getReservedQuantity());
            }
            BigDecimal remainingReserved = nonNull(material.getReservedQuantity()).subtract(released).max(BigDecimal.ZERO);
            material.setReservedQuantity(remainingReserved);
            if (remainingReserved.signum() == 0) {
                material.setInventoryReservationId(null);
                material.setStatus(ProductionMaterialStatus.PLANNED);
            } else {
                material.setStatus(ProductionMaterialStatus.PARTIALLY_RESERVED);
            }
            materialRepository.save(material);
        }
    }

    private MaterialAvailabilityResponse availabilityFor(ProductionOrderMaterial material,
                                                          ProductionOrder order, UUID companyId) {
        BigDecimal required = requiredQuantity(material);
        BigDecimal reserved = nonNull(material.getReservedQuantity());
        BigDecimal remaining = required.subtract(reserved).max(BigDecimal.ZERO);
        BigDecimal available = stockFor(material, order, companyId).availableQuantity();
        String status = available.compareTo(remaining) >= 0 ? "AVAILABLE"
                : available.signum() > 0 ? "PARTIALLY_AVAILABLE" : "NOT_AVAILABLE";
        return MaterialAvailabilityResponse.builder()
                .materialId(material.getId())
                .productId(material.getComponentProductId())
                .requiredQuantity(required)
                .uomId(material.getUomId())
                .availableQuantity(available)
                .alreadyReservedQuantity(reserved)
                .remainingRequiredQuantity(remaining)
                .availabilityStatus(status)
                .build();
    }

    private StockSnapshot stockFor(ProductionOrderMaterial material, ProductionOrder order, UUID companyId) {
        try {
            ResponseEntity<InventoryApiResponse<List<ProductStockInventoryResponse>>> response =
                    inventoryFeignClient.getGroupedStock(companyId, material.getComponentProductId(), null);
            InventoryApiResponse<List<ProductStockInventoryResponse>> body = response == null ? null : response.getBody();
            if (body == null || !body.isSuccess() || body.getData() == null) {
                throw new ExternalServiceException("Inventory availability response was invalid.");
            }

            BigDecimal totalAvailable = BigDecimal.ZERO;
            UUID firstBatch = null;
            for (ProductStockInventoryResponse product : body.getData()) {
                if (product == null || !material.getComponentProductId().equals(product.getProductId())) {
                    continue;
                }
                for (WarehouseStockInventoryResponse warehouse : safe(product.getWarehouses())) {
                    if (!order.getWarehouseId().equals(warehouse.getWarehouseId())) {
                        continue;
                    }
                    for (LocationStockInventoryResponse location : safe(warehouse.getLocations())) {
                        if (!order.getProductionLocationId().equals(location.getLocationId())) {
                            continue;
                        }
                        BigDecimal available = nonNull(location.getAvailableQuantity());
                        totalAvailable = totalAvailable.add(available);
                        if (firstBatch == null && available.signum() > 0) {
                            firstBatch = location.getBatchId();
                        }
                    }
                }
            }
            return new StockSnapshot(totalAvailable, firstBatch);
        } catch (FeignException e) {
            throw new ExternalServiceException("Inventory availability call failed.", e);
        }
    }

    private ReservationInventoryResponse createReservation(ReservationInventoryRequest request, UUID companyId) {
        try {
            ResponseEntity<InventoryApiResponse<ReservationInventoryResponse>> response =
                    inventoryFeignClient.createReservation(InventoryApiRequest.<ReservationInventoryRequest>builder()
                            .data(request).build(), companyId);
            InventoryApiResponse<ReservationInventoryResponse> body = response == null ? null : response.getBody();
            if (body == null || !body.isSuccess() || body.getData() == null || body.getData().getId() == null) {
                throw new ExternalServiceException("Inventory rejected the reservation.");
            }
            return body.getData();
        } catch (FeignException e) {
            throw new ExternalServiceException("Inventory reservation call failed.", e);
        }
    }

    private ReservationInventoryResponse releaseReservation(UUID reservationId, UUID companyId) {
        try {
            ResponseEntity<InventoryApiResponse<ReservationInventoryResponse>> response =
                    inventoryFeignClient.releaseReservation(reservationId, companyId);
            InventoryApiResponse<ReservationInventoryResponse> body = response == null ? null : response.getBody();
            if (body == null || !body.isSuccess() || body.getData() == null) {
                throw new ExternalServiceException("Inventory rejected the reservation release.");
            }
            return body.getData();
        } catch (FeignException e) {
            throw new ExternalServiceException("Inventory reservation release call failed.", e);
        }
    }

    private void saveReservationEvent(UUID companyId, UUID productionOrderId, ProductionOrderMaterial material,
                                      ReservationInventoryRequest request, ReservationInventoryResponse response,
                                      String idempotencyKey) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("productionOrderId", productionOrderId.toString());
        payload.put("productionOrderMaterialId", material.getId().toString());
        payload.put("productId", request.getProductId().toString());
        payload.put("uomId", material.getUomId().toString());
        payload.put("reservedQuantity", response.getReservedQuantity().toPlainString());
        payload.put("inventoryReservationId", response.getId().toString());
        ManufacturingOutbox event = ManufacturingOutbox.builder()
                .companyId(companyId)
                .aggregateType("PRODUCTION_ORDER")
                .aggregateId(productionOrderId)
                .eventType(com.erp.manufacturing.common.enums.OutboxEventType.PRODUCTION_MATERIAL_RESERVATION)
                .idempotencyKey(idempotencyKey)
                .payload(payload)
                .status(com.erp.manufacturing.common.enums.OutboxStatus.PENDING)
                .retryCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        outboxRepository.save(event);
    }

    private ProductionOrder loadOrder(UUID productionOrderId, UUID companyId) {
        return productionOrderRepository.findByIdAndCompanyId(productionOrderId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Production order not found: " + productionOrderId));
    }

    private void ensureAvailabilityState(ProductionOrder order) {
        if (order.getStatus() != ProductionOrderStatus.RELEASED
                && order.getStatus() != ProductionOrderStatus.IN_PROGRESS) {
            throw new BusinessValidationException("Material availability requires a released production order.");
        }
    }

    private void ensureReservableState(ProductionOrder order) {
        if (order.getStatus() != ProductionOrderStatus.RELEASED
                && order.getStatus() != ProductionOrderStatus.IN_PROGRESS) {
            throw new BusinessValidationException("Production order is not reservable in its current state.");
        }
    }

    private BigDecimal requiredQuantity(ProductionOrderMaterial material) {
        return nonNull(material.getPlannedQuantity()).subtract(nonNull(material.getConsumedQuantity())).max(BigDecimal.ZERO);
    }

    private BigDecimal remainingRequired(ProductionOrderMaterial material) {
        return requiredQuantity(material).subtract(nonNull(material.getReservedQuantity())).max(BigDecimal.ZERO);
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String reservationIdempotencyKey(UUID companyId, UUID productionOrderId, UUID materialId) {
        return companyId + ":" + productionOrderId + ":" + materialId + ":RESERVATION";
    }

    private <T> List<T> safe(List<T> values) {
        return values == null ? Collections.emptyList() : values;
    }

    private record StockSnapshot(BigDecimal availableQuantity, UUID batchId) {
    }
}
