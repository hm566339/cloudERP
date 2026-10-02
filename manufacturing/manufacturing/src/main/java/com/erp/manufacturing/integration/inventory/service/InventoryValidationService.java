package com.erp.manufacturing.integration.inventory.service;

import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.common.exception.ExternalServiceException;
import com.erp.manufacturing.common.exception.ResourceNotFoundException;
import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductUomInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.UnitOfMeasureInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.WarehouseInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.WarehouseLocationInventoryResponse;
import com.erp.manufacturing.util.TenantUtils;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryValidationService {

    private final InventoryFeignClient inventoryFeignClient;

    public void validateProduct(UUID productId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        ProductInventoryResponse product = fetchProduct(productId, companyId);

        if (product.getCompanyId() != null && !product.getCompanyId().equals(companyId)) {
            throw new BusinessValidationException("Product does not belong to the authenticated company.");
        }

        if (product.getProduct() == null || product.getProduct().getStatus() == null
                || !"ACTIVE".equalsIgnoreCase(product.getProduct().getStatus())) {
            throw new BusinessValidationException("Product is not active or is missing status.");
        }
    }

    public void validateUom(UUID uomId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        UnitOfMeasureInventoryResponse uom = fetchUnitOfMeasure(uomId, companyId);

        if (uom.getCompanyId() != null && !uom.getCompanyId().equals(companyId)) {
            throw new BusinessValidationException("UOM does not belong to the authenticated company.");
        }

        if (!Boolean.TRUE.equals(uom.getIsActive())) {
            throw new BusinessValidationException("UOM is inactive.");
        }
    }

    public void validateProductUom(UUID productId, UUID uomId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        validateProduct(productId, companyId);
        validateUom(uomId, companyId);

        ResponseEntity<InventoryApiResponse<List<ProductUomInventoryResponse>>> response = execute(() ->
                inventoryFeignClient.getProductUoms(productId, uomId, companyId, 0, 1));
        InventoryApiResponse<List<ProductUomInventoryResponse>> body = response == null ? null : response.getBody();
        List<ProductUomInventoryResponse> mappings = body == null ? null : body.getData();
        boolean compatible = body != null && body.isSuccess() && mappings != null
                && mappings.stream().anyMatch(mapping -> companyId.equals(mapping.getCompanyId())
                && productId.equals(mapping.getProductId())
                && uomId.equals(mapping.getUomId())
                && !Boolean.TRUE.equals(mapping.getIsDeleted()));
        if (!compatible) {
            throw new BusinessValidationException("UOM is not compatible with the product in Inventory.");
        }
    }

    public void validateWarehouse(UUID warehouseId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        WarehouseInventoryResponse warehouse = fetchWarehouse(warehouseId, companyId);

        if (warehouse.getCompanyId() != null && !warehouse.getCompanyId().equals(companyId)) {
            throw new BusinessValidationException("Warehouse does not belong to the authenticated company.");
        }

        if (warehouse.getStatus() == null || !"ACTIVE".equalsIgnoreCase(warehouse.getStatus())) {
            throw new BusinessValidationException("Warehouse is not active.");
        }
    }

    public void validateLocation(UUID locationId, UUID warehouseId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        WarehouseLocationInventoryResponse location = fetchLocation(locationId, companyId);

        if (location.getCompanyId() != null && !location.getCompanyId().equals(companyId)) {
            throw new BusinessValidationException("Location does not belong to the authenticated company.");
        }

        if (warehouseId != null && (location.getWarehouseId() == null || !location.getWarehouseId().equals(warehouseId))) {
            throw new BusinessValidationException("Location does not belong to the specified warehouse.");
        }

        if (!Boolean.TRUE.equals(location.getIsActive())) {
            throw new BusinessValidationException("Location is inactive.");
        }
    }

    private ProductInventoryResponse fetchProduct(UUID productId, UUID companyId) {
        ResponseEntity<InventoryApiResponse<ProductInventoryResponse>> response = execute(() ->
                inventoryFeignClient.getProductById(productId, companyId));
        InventoryApiResponse<ProductInventoryResponse> body = response == null ? null : response.getBody();
        if (body == null || !body.isSuccess() || body.getData() == null) {
            throw new ResourceNotFoundException("Product not found or invalid in Inventory: " + productId);
        }
        return body.getData();
    }

    private UnitOfMeasureInventoryResponse fetchUnitOfMeasure(UUID uomId, UUID companyId) {
        ResponseEntity<InventoryApiResponse<UnitOfMeasureInventoryResponse>> response = execute(() ->
                inventoryFeignClient.getUnitOfMeasureById(uomId, companyId));
        InventoryApiResponse<UnitOfMeasureInventoryResponse> body = response == null ? null : response.getBody();
        if (body == null || !body.isSuccess() || body.getData() == null) {
            throw new ResourceNotFoundException("UOM not found or invalid in Inventory: " + uomId);
        }
        return body.getData();
    }

    private WarehouseInventoryResponse fetchWarehouse(UUID warehouseId, UUID companyId) {
        ResponseEntity<InventoryApiResponse<WarehouseInventoryResponse>> response = execute(() ->
                inventoryFeignClient.getWarehouseById(warehouseId, companyId));
        InventoryApiResponse<WarehouseInventoryResponse> body = response == null ? null : response.getBody();
        if (body == null || !body.isSuccess() || body.getData() == null) {
            throw new ResourceNotFoundException("Warehouse not found or invalid in Inventory: " + warehouseId);
        }
        return body.getData();
    }

    private WarehouseLocationInventoryResponse fetchLocation(UUID locationId, UUID companyId) {
        ResponseEntity<InventoryApiResponse<WarehouseLocationInventoryResponse>> response = execute(() ->
                inventoryFeignClient.getLocationById(locationId, companyId));
        InventoryApiResponse<WarehouseLocationInventoryResponse> body = response == null ? null : response.getBody();
        if (body == null || !body.isSuccess() || body.getData() == null) {
            throw new ResourceNotFoundException("Location not found or invalid in Inventory: " + locationId);
        }
        return body.getData();
    }

    private <T> ResponseEntity<T> execute(InventoryCall<T> supplier) {
        try {
            return supplier.execute();
        } catch (FeignException e) {
            throw new ExternalServiceException("Inventory service call failed: " + e.getMessage(), e);
        }
    }

    @FunctionalInterface
    private interface InventoryCall<T> {
        ResponseEntity<T> execute();
    }
}
