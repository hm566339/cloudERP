package com.erp.inventory.modules.product.service.serviceImpl;

import com.erp.inventory.modules.product.dto.request.ProductRequest;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.product.dto.request.ProductFilterRequest;
import com.erp.inventory.modules.product.dto.response.CurrentStock;
import com.erp.inventory.modules.product.dto.response.ProductDetailResponse;
import com.erp.inventory.modules.product.dto.response.ProductDetailResponse.CategoryInfo;
import com.erp.inventory.modules.product.dto.response.ProductDetailResponse.HsnSacInfo;
import com.erp.inventory.modules.product.dto.response.ProductDetailResponse.InventorySettings;
import com.erp.inventory.modules.product.dto.response.ProductDetailResponse.LocationInfo;
import com.erp.inventory.modules.product.dto.response.ProductDetailResponse.PricingInfo;
import com.erp.inventory.modules.product.dto.response.ProductDetailResponse.ProductInfo;
import com.erp.inventory.modules.product.dto.response.ProductDetailResponse.UomInfo;
import com.erp.inventory.modules.product.dto.response.ProductResponse;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.service.ProductService;
import com.erp.inventory.modules.product.mapper.ProductMapper;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.modules.product.repository.ProductCategoryRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.serial.repository.ProductSerialRepository;
import com.erp.inventory.modules.pricing.repository.ProductPriceRepository;
import com.erp.inventory.common.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository repository;
    private final ProductMapper mapper;
    private final ProductCategoryRepository categoryRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final StockMovementLineRepository stockMovementLineRepository;
    private final ProductBatchRepository productBatchRepository;
    private final ProductSerialRepository productSerialRepository;
    private final ProductPriceRepository productPriceRepository;

    @Override
    public ProductResponse create(ProductRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Initiating Product creation for companyId: {}", companyId);
        log.debug("Product creation payload: {}", request);

        validateProductRequest(request, companyId, null);
        var entity = mapper.toEntity(request);
        entity.setProductCode(generateProductCode(request.getProductName(), companyId));
        log.info("Auto-generated Product Code: {}", entity.getProductCode());

        validateCodeUniqueness(entity.getProductCode(), companyId, null);

        entity.setCompanyId(companyId);
        entity = repository.save(entity);
        log.info("Successfully created Product with id: {}", entity.getId());
        return mapper.toResponse(entity);
    }

    @Override
    public ProductResponse getById(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.debug("Fetching Product with id: {} and companyId: {}", id, companyId);
        var entity = repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> {
                    log.warn("Product not found with id: {} and companyId: {}", id, companyId);
                    return new ResourceNotFoundException("Product not found with id: " + id);
                });
        return enrichProductResponse(mapper.toResponse(entity), companyId);
    }

    @Override
    public ProductDetailResponse getProductDetailById(UUID id,
            UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.debug("Fetching Product detail with id: {} and companyId: {}", id, companyId);

        Product product = repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        InventoryStock inventoryStock = inventoryStockRepository.findByProductIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory stock not found with id: " + id));

        var productInfo = ProductInfo.builder()
                .productCode(product.getProductCode())
                .sku(product.getSku())
                .productName(product.getProductName())
                .productType(product.getProductType() != null ? product.getProductType().name() : null)
                .description(product.getDescription())
                .barcode(product.getBarcode())
                .alternateBarcode(product.getAlternateBarcode())
                .status(product.getStatus() != null ? product.getStatus().name() : null)
                .build();

        var categoryInfoBuilder = CategoryInfo
                .builder();
        if (product.getCategoryId() != null) {
            categoryRepository.findByIdAndCompanyId(product.getCategoryId(), companyId)
                    .ifPresent(cat -> categoryInfoBuilder.id(cat.getId()).name(cat.getName()).code(cat.getCode()));
        }

        var uomInfoBuilder = UomInfo.builder();
        if (product.getBaseUomId() != null) {
            uomRepository.findByIdAndCompanyId(product.getBaseUomId(), companyId)
                    .ifPresent(uom -> uomInfoBuilder.id(uom.getId()).name(uom.getName()).code(uom.getCode())
                            .symbol(uom.getCode()));
        }

        var hsnSacBuilder = HsnSacInfo.builder();
        if (product.getHsnSacId() != null) {
            hsnSacBuilder.id(product.getHsnSacId());
        }
        if (product.getHsnSacCode() != null) {
            hsnSacBuilder.code(product.getHsnSacCode());
        }
        if (product.getHsnSacName() != null) {
            hsnSacBuilder.description(product.getHsnSacName());
        }

        var pricingInfo = PricingInfo.builder()
                .standardCost(product.getStandardCost())
                .sellingPrice(product.getSellingPrice())
                .currency("INR")
                .build();

        var inventorySettings = InventorySettings.builder()
                .trackingType(
                        product.getTrackingType() != null
                                ? product.getTrackingType().name()
                                : null)
                .valuationMethod(
                        product.getValuationMethod() != null
                                ? product.getValuationMethod().name()
                                : null)
                .build();

        var currentStock = CurrentStock.builder()
                .quantity(inventoryStock.getQuantity())
                .reservedQuantity(inventoryStock.getReservedQuantity())
                .availableQuantity(inventoryStock.getAvailableQuantity())
                .averageCost(inventoryStock.getAverageCost())
                .stockValue(inventoryStock.getStockValue())
                .build();

        java.util.List<com.erp.inventory.modules.stock.entity.InventoryStock> stocks = inventoryStockRepository
                .findAllByProductIdAndCompanyId(product.getId(), companyId)
                .stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .toList();

        java.math.BigDecimal totalQty = java.math.BigDecimal.ZERO;
        java.math.BigDecimal availableQty = java.math.BigDecimal.ZERO;
        java.math.BigDecimal reservedQty = java.math.BigDecimal.ZERO;
        java.math.BigDecimal stockValue = java.math.BigDecimal.ZERO;

        java.util.Map<UUID, com.erp.inventory.modules.product.dto.response.ProductDetailResponse.WarehouseInventory> warehouseMap = new java.util.HashMap<>();

        for (var stock : stocks) {
            java.math.BigDecimal qty = stock.getQuantity() != null ? stock.getQuantity() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal avail = stock.getAvailableQuantity() != null ? stock.getAvailableQuantity()
                    : java.math.BigDecimal.ZERO;
            java.math.BigDecimal res = stock.getReservedQuantity() != null ? stock.getReservedQuantity()
                    : java.math.BigDecimal.ZERO;
            java.math.BigDecimal val = stock.getStockValue() != null ? stock.getStockValue()
                    : java.math.BigDecimal.ZERO;

            totalQty = totalQty.add(qty);
            availableQty = availableQty.add(avail);
            reservedQty = reservedQty.add(res);
            stockValue = stockValue.add(val);

            UUID wId = stock.getWarehouseId();
            if (wId != null) {
                warehouseMap.compute(wId, (k, existing) -> {
                    if (existing == null) {
                        var inventoryBuilder = com.erp.inventory.modules.product.dto.response.ProductDetailResponse.InventoryDetail
                                .builder()
                                .quantity(qty)
                                .availableQuantity(avail)
                                .reservedQuantity(res)
                                .stockValue(val);

                        var locationBuilder = LocationInfo.builder();
                        if (stock.getLocation() != null) {
                            locationBuilder.id(stock.getLocationId())
                                    .name(stock.getLocation().getLocationName());
                        }

                        var whBuilder = com.erp.inventory.modules.product.dto.response.ProductDetailResponse.WarehouseInventory
                                .builder()
                                .warehouseId(wId)
                                .location(locationBuilder.build())
                                .inventory(inventoryBuilder.build());

                        if (stock.getWarehouse() != null) {
                            whBuilder.warehouseName(stock.getWarehouse().getWarehouseName());
                            whBuilder.warehouseCode(stock.getWarehouse().getWarehouseCode());
                        }
                        return whBuilder.build();
                    } else {
                        var inv = existing.getInventory();
                        inv.setQuantity(inv.getQuantity().add(qty));
                        inv.setAvailableQuantity(inv.getAvailableQuantity().add(avail));
                        inv.setReservedQuantity(inv.getReservedQuantity().add(res));
                        inv.setStockValue(inv.getStockValue().add(val));
                        return existing;
                    }
                });
            }
        }

        java.util.List<com.erp.inventory.modules.product.dto.response.ProductDetailResponse.WarehouseInventory> warehouses = new java.util.ArrayList<>(
                warehouseMap.values());

        var stockSummary = com.erp.inventory.modules.product.dto.response.ProductDetailResponse.StockSummary.builder()
                .totalQuantity(totalQty)
                .availableQuantity(availableQty)
                .reservedQuantity(reservedQty)
                .committedQuantity(java.math.BigDecimal.ZERO)
                .totalStockValue(stockValue)
                .warehouseCount((int) warehouses.stream().map(w -> w.getWarehouseId()).distinct().count())
                .build();

        var accountingInfo = com.erp.inventory.modules.product.dto.response.ProductDetailResponse.AccountingInfo
                .builder()
                .inventoryAccount(product.getInventoryAccountId() != null
                        ? com.erp.inventory.modules.product.dto.response.ProductDetailResponse.AccountInfo.builder()
                                .id(product.getInventoryAccountId()).build()
                        : null)
                .cogsAccount(product.getCogsAccountId() != null
                        ? com.erp.inventory.modules.product.dto.response.ProductDetailResponse.AccountInfo.builder()
                                .id(product.getCogsAccountId()).build()
                        : null)
                .salesAccount(product.getSalesAccountId() != null
                        ? com.erp.inventory.modules.product.dto.response.ProductDetailResponse.AccountInfo.builder()
                                .id(product.getSalesAccountId()).build()
                        : null)
                .purchaseAccount(product.getPurchaseAccountId() != null
                        ? com.erp.inventory.modules.product.dto.response.ProductDetailResponse.AccountInfo.builder()
                                .id(product.getPurchaseAccountId()).build()
                        : null)
                .build();

        var metadata = com.erp.inventory.modules.product.dto.response.ProductDetailResponse.Metadata.builder()
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .createdBy(product.getCreatedBy())
                .updatedBy(product.getUpdatedBy())
                .version(product.getVersion())
                .build();

        return com.erp.inventory.modules.product.dto.response.ProductDetailResponse.builder()
                .id(product.getId())
                .companyId(product.getCompanyId())
                .product(productInfo)
                .category(categoryInfoBuilder.build())
                .uom(uomInfoBuilder.build())
                .hsnSac(hsnSacBuilder.build())
                .pricing(pricingInfo)
                .inventorySettings(inventorySettings)
                .stockSummary(stockSummary)
                .warehouses(warehouses)
                .accounting(accountingInfo)
                .suppliers(java.util.Collections.emptyList())
                .recentTransactions(java.util.Collections.emptyList())
                .metadata(metadata)
                .build();
    }

    @Override
    public Page<ProductResponse> getAll(ProductFilterRequest filter, UUID requestCompanyId, Pageable pageable) {
        UUID companyId = TenantUtils.resolveCompanyIdForQuery(requestCompanyId);
        log.debug("Fetching Product list with filter: {}, companyId: {}, pageable: {}", filter, companyId, pageable);
        filter.setCompanyId(companyId);
        org.springframework.data.jpa.domain.Specification<com.erp.inventory.modules.product.entity.Product> spec = com.erp.inventory.modules.product.repository.ProductSpecification
                .getSpecification(filter);
        return repository.findAll(spec, pageable)
                .map(mapper::toResponse)
                .map(response -> enrichProductResponse(response, companyId));
    }

    @Override
    public ProductResponse update(UUID id, ProductRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Initiating Product update for id: {} and companyId: {}", id, companyId);
        log.debug("Product update payload: {}", request);

        var entity = repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> {
                    log.warn("Failed to update. Product not found with id: {} and companyId: {}", id, companyId);
                    return new ResourceNotFoundException("Product not found with id: " + id);
                });

        validateProductRequest(request, entity.getCompanyId(), id);

        if (hasReferences(id, companyId)) {
            if (request.getTrackingType() != null && !request.getTrackingType().equals(entity.getTrackingType())) {
                throw new BusinessValidationException(
                        "Cannot change tracking type of a product that has existing inventory references");
            }
            if (request.getBaseUomId() != null && !request.getBaseUomId().equals(entity.getBaseUomId())) {
                throw new BusinessValidationException(
                        "Cannot change Base UOM of a product that has existing inventory references");
            }
            if (request.getValuationMethod() != null
                    && !request.getValuationMethod().equals(entity.getValuationMethod())) {
                throw new BusinessValidationException(
                        "Cannot change valuation method of a product that has existing inventory references");
            }
        }

        mapper.updateEntityFromRequest(request, entity);
        entity = repository.save(entity);
        log.info("Successfully updated Product with id: {}", id);
        return mapper.toResponse(entity);
    }

    @Override
    public void delete(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Initiating deletion of Product with id: {} and companyId: {}", id, companyId);
        if (!repository.existsByIdAndCompanyId(id, companyId)) {
            log.warn("Failed to delete. Product not found with id: {} and companyId: {}", id, companyId);
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }

        if (hasReferences(id, companyId)) {
            throw new BusinessValidationException(
                    "Cannot physically delete a product that has existing inventory references");
        }

        repository.deleteById(id);
        log.info("Successfully deleted Product with id: {}", id);
    }

    private boolean hasReferences(UUID productId, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        return inventoryStockRepository.existsByProductIdAndCompanyId(productId, company) ||
                stockMovementLineRepository.existsByProductIdAndCompanyId(productId, company) ||
                productBatchRepository.existsByProductIdAndCompanyId(productId, company) ||
                productSerialRepository.existsByProductIdAndCompanyId(productId, company);
    }

    private void validateCodeUniqueness(String code, UUID companyId, UUID currentId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (code != null) {
            boolean exists = repository.existsByProductCodeAndCompanyId(code, company);
            if (exists && (currentId == null || !repository.findByIdAndCompanyId(currentId, company)
                    .map(p -> p.getProductCode().equals(code)).orElse(false))) {
                log.warn("Validation failed: Product with code {} already exists for company: {}", code, company);
                throw new BusinessValidationException("Product with code " + code + " already exists.");
            }
        }
    }

    private void validateProductRequest(ProductRequest request, UUID companyId, UUID currentProductId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (request.getProductName() == null || request.getProductName().trim().isEmpty()) {
            throw new BusinessValidationException("Product name is required");
        }
        if (request.getTrackingType() == null) {
            throw new BusinessValidationException("Tracking type is required");
        }
        if (request.getValuationMethod() == null) {
            throw new BusinessValidationException("Valuation method is required");
        }
        if (request.getProductType() == null) {
            throw new BusinessValidationException("Product type is required");
        }
        if (request.getCategoryId() == null) {
            throw new BusinessValidationException("Category ID is required");
        }
        if (request.getBaseUomId() == null) {
            throw new BusinessValidationException("Base UOM ID is required");
        }

        if (request.getSku() != null) {
            boolean exists = repository.existsBySkuAndCompanyId(request.getSku(), company);
            if (exists && (currentProductId == null || !repository.findByIdAndCompanyId(currentProductId, company)
                    .map(p -> p.getSku().equals(request.getSku())).orElse(false))) {
                log.warn("Validation failed: Product with SKU {} already exists for company: {}", request.getSku(),
                        company);
                throw new BusinessValidationException("Product with SKU " + request.getSku() + " already exists.");
            }
        }

        if (request.getCategoryId() != null
                && categoryRepository.findByIdAndCompanyId(request.getCategoryId(), company).isEmpty()) {
            log.warn("Validation failed: Invalid Category ID {} provided for company: {}", request.getCategoryId(),
                    company);
            throw new BusinessValidationException(
                    "Invalid Category ID provided or it does not belong to this company.");
        }

        if (request.getBaseUomId() != null
                && uomRepository.findByIdAndCompanyId(request.getBaseUomId(), company).isEmpty()) {
            log.warn("Validation failed: Invalid Base UOM ID {} provided for company: {}", request.getBaseUomId(),
                    company);
            throw new BusinessValidationException(
                    "Invalid Base UOM ID provided or it does not belong to this company.");
        }
    }

    private String generateProductCode(String name, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        String prefix = "PRO";
        if (name != null && !name.trim().isEmpty()) {
            String cleanName = name.replaceAll("\\s+", "");
            if (cleanName.length() >= 3) {
                prefix = cleanName.substring(0, 3).toUpperCase();
            } else {
                prefix = cleanName.toUpperCase();
            }
        }
        LocalDate now = LocalDate.now();
        String datePart = String.format("%02d%02d", now.getMonthValue(), now.getYear() % 100);
        String baseCode = prefix + datePart;

        String generatedCode = baseCode + "001";
        int counter = 1;
        while (repository.existsByProductCodeAndCompanyId(generatedCode, company)) {
            counter++;
            generatedCode = baseCode + String.format("%03d", counter);
        }
        return generatedCode;
    }

    private ProductResponse enrichProductResponse(ProductResponse response, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (response.getBaseUomId() != null) {
            uomRepository.findByIdAndCompanyId(response.getBaseUomId(), company)
                    .ifPresent(uom -> response.setBaseUomCode(uom.getCode()));
        }

        return response;
    }
}
