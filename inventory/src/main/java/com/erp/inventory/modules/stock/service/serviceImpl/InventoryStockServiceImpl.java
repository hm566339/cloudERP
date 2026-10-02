package com.erp.inventory.modules.stock.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.stock.dto.request.InventoryStockRequest;
import com.erp.inventory.modules.stock.dto.request.InventoryStockFilterRequest;
import com.erp.inventory.modules.stock.dto.response.InventoryStockResponse;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.stock.mapper.InventoryStockMapper;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.InventoryStockSpecification;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;
import com.erp.inventory.common.security.CurrentUserContext;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InventoryStockServiceImpl implements InventoryStockService {

    private final InventoryStockRepository repository;
    private final InventoryStockMapper mapper;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final ProductBatchRepository productBatchRepository;

    @Override
    public InventoryStockResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.debug("Fetching InventoryStock with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("InventoryStock not found with id: {} for company: {}", id, company);
                    return new ResourceNotFoundException("InventoryStock not found with id: " + id);
                });
        return mapper.toResponse(entity);
    }

    @Override
    public Page<InventoryStockResponse> getAll(InventoryStockFilterRequest filter, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyId(filter.getCompanyId());
        log.debug("Fetching InventoryStock list with filter: {}, pageable: {}", filter, pageable);
        var spec = InventoryStockSpecification.getFilterSpecification(filter, company);
        return repository.findAll(spec, pageable).map(mapper::toResponse);
    }

    @Override
    public InventoryStock addStock(UUID productId, UUID warehouseId, UUID locationId, UUID batchId, BigDecimal quantity,
            BigDecimal unitCost, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("ABOUT TO UPDATE INVENTORY: productId={}, warehouseId={}, locationId={}, batchId={}, quantity={}, unitCost={}, companyId={}",
                productId, warehouseId, locationId, batchId, quantity, unitCost, company);

        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Quantity to add must be greater than zero");
        }

        validateEntities(productId, warehouseId, locationId, batchId, company);

        log.info("[INVENTORY STOCK LOOKUP] Searching stock with pessimistic lock for productId: {}, warehouseId: {}, locationId: {}, batchId: {}, companyId: {}",
                productId, warehouseId, locationId, batchId, company);

        var stockOpt = repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, company);
        log.info("INVENTORY LOOKUP RESULT: present={}, stockId={}",
                stockOpt.isPresent(), stockOpt.map(InventoryStock::getId).orElse(null));

        if (stockOpt.isPresent()) {
            var stock = stockOpt.get();
            log.info("ABOUT TO UPDATE EXISTING INVENTORY: stockId={}, currentQuantity={}, currentAvailable={}, currentAvgCost={}",
                    stock.getId(), stock.getQuantity(), stock.getAvailableQuantity(), stock.getAverageCost());

            applyStockAddition(stock, quantity, unitCost);

            log.info("[INVENTORY STOCK INSERT / UPDATE] Performing UPDATE on inventory_stock id: {}, newQuantity: {}, newAvailable: {}, newAvgCost: {}, newStockValue: {}",
                    stock.getId(), stock.getQuantity(), stock.getAvailableQuantity(), stock.getAverageCost(), stock.getStockValue());

            InventoryStock saved = repository.saveAndFlush(stock);

            log.info("INVENTORY SAVE COMPLETE: updated stockId={}, version={}, resultingQuantity={}",
                    saved.getId(), saved.getVersion(), saved.getQuantity());
            log.info("[STOCK-IN INVENTORY PROCESS COMPLETE] Stock IN completed for productId: {}, resultingQuantity: {}",
                    productId, saved.getQuantity());
            return saved;
        } else {
            log.info("ABOUT TO INSERT INVENTORY: productId={}, warehouseId={}, locationId={}, batchId={}, quantity={}, unitCost={}",
                    productId, warehouseId, locationId, batchId, quantity, unitCost);

            BigDecimal effectiveUnitPrice = (unitCost != null && unitCost.compareTo(BigDecimal.ZERO) >= 0) ? unitCost : BigDecimal.ZERO;
            BigDecimal stockValue = quantity.multiply(effectiveUnitPrice).setScale(4, RoundingMode.HALF_UP);

            var stock = new InventoryStock();
            stock.setProductId(productId);
            stock.setWarehouseId(warehouseId);
            stock.setLocationId(locationId);
            stock.setBatchId(batchId);
            stock.setCompanyId(company);
            stock.setQuantity(quantity);
            stock.setAvailableQuantity(quantity);
            stock.setReservedQuantity(BigDecimal.ZERO);
            stock.setAverageCost(effectiveUnitPrice);
            stock.setStockValue(stockValue);
            stock.setLastMovementAt(LocalDateTime.now());
            stock.setIsDeleted(false);
            if (CurrentUserContext.getUserId() != null) {
                stock.setCreatedBy(CurrentUserContext.getUserId());
                stock.setUpdatedBy(CurrentUserContext.getUserId());
            }

            log.info("[INVENTORY STOCK INSERT / UPDATE] Performing INSERT on inventory_stock: qty: {}, avgCost: {}, stockValue: {}",
                    quantity, effectiveUnitPrice, stockValue);

            try {
                InventoryStock saved = repository.saveAndFlush(stock);
                log.info("INVENTORY SAVE COMPLETE: inserted stockId={}, version={}, resultingQuantity={}",
                        saved.getId(), saved.getVersion(), saved.getQuantity());
                log.info("[STOCK-IN INVENTORY PROCESS COMPLETE] Stock IN completed for productId: {}, resultingQuantity: {}",
                        productId, saved.getQuantity());
                return saved;
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                log.warn("[CONCURRENT RACE DETECTED] Concurrent insert detected on inventory_stock: {}. Reloading row with pessimistic lock.", ex.getMessage());
                var concurrentStock = repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, company)
                        .orElseThrow(() -> ex);
                applyStockAddition(concurrentStock, quantity, unitCost);
                InventoryStock saved = repository.saveAndFlush(concurrentStock);
                log.info("INVENTORY SAVE COMPLETE: race-updated stockId={}, resultingQuantity={}",
                        saved.getId(), saved.getQuantity());
                log.info("[STOCK-IN INVENTORY PROCESS COMPLETE] Stock IN completed for productId: {}, resultingQuantity: {}",
                        productId, saved.getQuantity());
                return saved;
            }
        }
    }

    private void applyStockAddition(InventoryStock stock, BigDecimal quantity, BigDecimal unitCost) {
        BigDecimal oldQuantity = stock.getQuantity() != null ? stock.getQuantity() : BigDecimal.ZERO;
        BigDecimal newQuantity = oldQuantity.add(quantity);

        BigDecimal oldAvailable = stock.getAvailableQuantity() != null ? stock.getAvailableQuantity() : BigDecimal.ZERO;
        BigDecimal newAvailable = oldAvailable.add(quantity);

        BigDecimal oldAverageCost = stock.getAverageCost() != null ? stock.getAverageCost() : BigDecimal.ZERO;
        BigDecimal effectiveUnitPrice = (unitCost != null && unitCost.compareTo(BigDecimal.ZERO) >= 0) ? unitCost : oldAverageCost;

        BigDecimal oldValue = oldQuantity.multiply(oldAverageCost);
        BigDecimal incomingValue = quantity.multiply(effectiveUnitPrice);
        BigDecimal newTotalValue = oldValue.add(incomingValue);

        BigDecimal newAverageCost;
        if (newQuantity.compareTo(BigDecimal.ZERO) > 0) {
            newAverageCost = newTotalValue.divide(newQuantity, 4, RoundingMode.HALF_UP);
        } else {
            newAverageCost = effectiveUnitPrice;
        }
        BigDecimal newStockValue = newQuantity.multiply(newAverageCost).setScale(4, RoundingMode.HALF_UP);

        stock.setQuantity(newQuantity);
        stock.setAvailableQuantity(newAvailable);
        // reservedQuantity is preserved untouched!
        stock.setAverageCost(newAverageCost);
        stock.setStockValue(newStockValue);
        stock.setLastMovementAt(LocalDateTime.now());
        stock.setUpdatedAt(LocalDateTime.now());
        if (CurrentUserContext.getUserId() != null) {
            stock.setUpdatedBy(CurrentUserContext.getUserId());
        }
    }

    @Override
    public void removeStock(UUID productId, UUID warehouseId, UUID locationId, UUID batchId, BigDecimal quantity,
            UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Removing stock for productId: {}, quantity: {}", productId, quantity);
        validateEntities(productId, warehouseId, locationId, batchId, company);
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Quantity to remove must be greater than zero");
        }
        var stock = repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, company)
                .orElseThrow(
                        () -> new BusinessValidationException("Cannot remove stock: Inventory stock does not exist"));

        BigDecimal oldQuantity = stock.getQuantity() != null ? stock.getQuantity() : BigDecimal.ZERO;
        BigDecimal oldAvailable = stock.getAvailableQuantity() != null ? stock.getAvailableQuantity() : BigDecimal.ZERO;

        if (quantity.compareTo(oldAvailable) > 0) {
            throw new BusinessValidationException("Insufficient available stock.");
        }

        BigDecimal newQuantity = oldQuantity.subtract(quantity);
        BigDecimal newAvailable = oldAvailable.subtract(quantity);

        stock.setQuantity(newQuantity);
        stock.setAvailableQuantity(newAvailable);

        if (newQuantity.compareTo(BigDecimal.ZERO) == 0) {
            stock.setAverageCost(BigDecimal.ZERO);
            stock.setStockValue(BigDecimal.ZERO);
        } else {
            BigDecimal avgCost = stock.getAverageCost() != null ? stock.getAverageCost() : BigDecimal.ZERO;
            stock.setStockValue(newQuantity.multiply(avgCost).setScale(4, java.math.RoundingMode.HALF_UP));
        }

        stock.setLastMovementAt(java.time.LocalDateTime.now());
        repository.save(stock);
    }

    @Override
    public void reserveStock(UUID productId, UUID warehouseId, UUID locationId, UUID batchId, BigDecimal quantity,
            UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Reserving stock for productId: {}, quantity: {}", productId, quantity);
        validateEntities(productId, warehouseId, locationId, batchId, company);
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Quantity to reserve must be greater than zero");
        }
        var stock = repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, company)
                .orElseThrow(
                        () -> new BusinessValidationException("Cannot reserve stock: Inventory stock does not exist"));

        BigDecimal oldAvailable = stock.getAvailableQuantity() != null ? stock.getAvailableQuantity() : BigDecimal.ZERO;
        if (quantity.compareTo(oldAvailable) > 0) {
            throw new BusinessValidationException("Insufficient available stock for reservation.");
        }

        BigDecimal oldReserved = stock.getReservedQuantity() != null ? stock.getReservedQuantity() : BigDecimal.ZERO;

        stock.setReservedQuantity(oldReserved.add(quantity));
        stock.setAvailableQuantity(oldAvailable.subtract(quantity));
        repository.save(stock);
    }

    @Override
    public void releaseReservedStock(UUID productId, UUID warehouseId, UUID locationId, UUID batchId,
            BigDecimal quantity, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Releasing reserved stock for productId: {}, quantity: {}", productId, quantity);
        validateEntities(productId, warehouseId, locationId, batchId, company);
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Quantity to release must be greater than zero");
        }
        var stock = repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, company)
                .orElseThrow(
                        () -> new BusinessValidationException("Cannot release stock: Inventory stock does not exist"));

        BigDecimal oldReserved = stock.getReservedQuantity() != null ? stock.getReservedQuantity() : BigDecimal.ZERO;
        if (quantity.compareTo(oldReserved) > 0) {
            throw new BusinessValidationException("Cannot release more than currently reserved stock.");
        }

        BigDecimal oldAvailable = stock.getAvailableQuantity() != null ? stock.getAvailableQuantity() : BigDecimal.ZERO;

        stock.setReservedQuantity(oldReserved.subtract(quantity));
        stock.setAvailableQuantity(oldAvailable.add(quantity));
        repository.save(stock);
    }

    @Override
    public void consumeReservedStock(UUID productId, UUID warehouseId, UUID locationId, UUID batchId,
            BigDecimal quantity, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Consuming reserved stock for productId: {}, quantity: {}", productId, quantity);
        validateEntities(productId, warehouseId, locationId, batchId, company);
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Quantity to consume must be greater than zero");
        }
        var stock = repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, company)
                .orElseThrow(
                        () -> new BusinessValidationException("Cannot consume stock: Inventory stock does not exist"));

        BigDecimal oldReserved = stock.getReservedQuantity() != null ? stock.getReservedQuantity() : BigDecimal.ZERO;
        if (quantity.compareTo(oldReserved) > 0) {
            throw new BusinessValidationException("Cannot consume more than currently reserved stock.");
        }

        BigDecimal oldQuantity = stock.getQuantity() != null ? stock.getQuantity() : BigDecimal.ZERO;

        BigDecimal newReserved = oldReserved.subtract(quantity);
        BigDecimal newQuantity = oldQuantity.subtract(quantity);

        stock.setReservedQuantity(newReserved);
        stock.setQuantity(newQuantity);

        if (newQuantity.compareTo(BigDecimal.ZERO) == 0) {
            stock.setAverageCost(BigDecimal.ZERO);
            stock.setStockValue(BigDecimal.ZERO);
        } else {
            BigDecimal avgCost = stock.getAverageCost() != null ? stock.getAverageCost() : BigDecimal.ZERO;
            stock.setStockValue(newQuantity.multiply(avgCost).setScale(4, java.math.RoundingMode.HALF_UP));
        }

        stock.setLastMovementAt(java.time.LocalDateTime.now());
        repository.save(stock);
    }

    private void validateEntities(UUID productId, UUID warehouseId, UUID locationId, UUID batchId, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        productRepository.findByIdAndCompanyId(productId, company)
                .orElseThrow(() -> new BusinessValidationException("Product not found with id: " + productId));

        warehouseRepository.findByIdAndCompanyId(warehouseId, company)
                .orElseThrow(() -> new BusinessValidationException("Warehouse not found with id: " + warehouseId));

        if (locationId != null) {
            var location = warehouseLocationRepository.findByIdAndCompanyId(locationId, company)
                    .orElseThrow(() -> new BusinessValidationException(
                            "Warehouse Location not found with id: " + locationId));
            if (location.getWarehouseId() != null && !location.getWarehouseId().equals(warehouseId)) {
                throw new BusinessValidationException(
                        "Warehouse Location " + locationId + " does not belong to Warehouse " + warehouseId);
            }
        }

        if (batchId != null) {
            var batch = productBatchRepository.findByIdAndCompanyId(batchId, company)
                    .orElseThrow(() -> new BusinessValidationException("Batch not found with id: " + batchId));
            if (batch.getProductId() != null && !batch.getProductId().equals(productId)) {
                throw new BusinessValidationException("Batch " + batchId + " does not belong to Product " + productId);
            }
        }
    }

    private void validateRequest(InventoryStockRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (request.getProductId() != null) {
            productRepository.findByIdAndCompanyId(request.getProductId(), company)
                    .orElseThrow(() -> {
                        log.warn("Validation failed: Product not found with id: {}", request.getProductId());
                        return new BusinessValidationException("Product not found with id: " + request.getProductId());
                    });
        }

        if (request.getWarehouseId() != null) {
            warehouseRepository.findByIdAndCompanyId(request.getWarehouseId(), company)
                    .orElseThrow(() -> {
                        log.warn("Validation failed: Warehouse not found with id: {}", request.getWarehouseId());
                        return new BusinessValidationException(
                                "Warehouse not found with id: " + request.getWarehouseId());
                    });
        }

        if (request.getLocationId() != null) {
            warehouseLocationRepository.findByIdAndCompanyId(request.getLocationId(), company)
                    .orElseThrow(() -> {
                        log.warn("Validation failed: Warehouse Location not found with id: {}",
                                request.getLocationId());
                        return new BusinessValidationException(
                                "Warehouse Location not found with id: " + request.getLocationId());
                    });
        }

        if (request.getQuantity() != null && request.getReservedQuantity() != null
                && request.getAvailableQuantity() != null) {
            BigDecimal expectedQuantity = request.getReservedQuantity().add(request.getAvailableQuantity());
            if (request.getQuantity().compareTo(expectedQuantity) != 0) {
                log.warn(
                        "Validation failed: Quantity ({}) does not match the sum of Reserved ({}) and Available ({}) quantities",
                        request.getQuantity(), request.getReservedQuantity(), request.getAvailableQuantity());
                throw new BusinessValidationException("Quantity must be the sum of reserved and available quantities");
            }
        }
    }
}
