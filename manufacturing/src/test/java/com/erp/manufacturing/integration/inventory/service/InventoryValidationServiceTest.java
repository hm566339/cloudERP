package com.erp.manufacturing.integration.inventory.service;

import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductInventoryInfo;
import com.erp.manufacturing.integration.inventory.dto.UnitOfMeasureInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.WarehouseInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.WarehouseLocationInventoryResponse;
import com.erp.manufacturing.common.exception.BusinessValidationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryValidationServiceTest {

    @Mock
    private InventoryFeignClient inventoryFeignClient;

    @InjectMocks
    private InventoryValidationService inventoryValidationService;

    @Test
    void validateProduct_acceptsActiveProductFromSameCompany() {
        UUID companyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();

        ProductInventoryResponse product = new ProductInventoryResponse();
        product.setId(productId);
        product.setCompanyId(companyId);
        ProductInventoryInfo info = new ProductInventoryInfo();
        info.setStatus("ACTIVE");
        product.setProduct(info);

        when(inventoryFeignClient.getProductById(productId, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(product)));

        assertDoesNotThrow(() -> inventoryValidationService.validateProduct(productId, companyId));
    }

    @Test
    void validateProduct_rejectsInactiveProduct() {
        UUID companyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();

        ProductInventoryResponse product = new ProductInventoryResponse();
        product.setId(productId);
        product.setCompanyId(companyId);
        ProductInventoryInfo info = new ProductInventoryInfo();
        info.setStatus("INACTIVE");
        product.setProduct(info);

        when(inventoryFeignClient.getProductById(productId, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(product)));

        assertThrows(BusinessValidationException.class,
                () -> inventoryValidationService.validateProduct(productId, companyId));
    }

    @Test
    void validateUom_rejectsInactiveUom() {
        UUID companyId = UUID.randomUUID();
        UUID uomId = UUID.randomUUID();

        UnitOfMeasureInventoryResponse uom = new UnitOfMeasureInventoryResponse();
        uom.setId(uomId);
        uom.setCompanyId(companyId);
        uom.setIsActive(false);

        when(inventoryFeignClient.getUnitOfMeasureById(uomId, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(uom)));

        assertThrows(BusinessValidationException.class,
                () -> inventoryValidationService.validateUom(uomId, companyId));
    }

    @Test
    void validateWarehouse_rejectsWrongCompany() {
        UUID companyId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();

        WarehouseInventoryResponse warehouse = new WarehouseInventoryResponse();
        warehouse.setId(warehouseId);
        warehouse.setCompanyId(UUID.randomUUID());
        warehouse.setStatus("ACTIVE");

        when(inventoryFeignClient.getWarehouseById(warehouseId, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(warehouse)));

        assertThrows(BusinessValidationException.class,
                () -> inventoryValidationService.validateWarehouse(warehouseId, companyId));
    }

    @Test
    void validateLocation_acceptsActiveLocationSameCompany() {
        UUID companyId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        UUID locationId = UUID.randomUUID();

        WarehouseLocationInventoryResponse location = new WarehouseLocationInventoryResponse();
        location.setId(locationId);
        location.setCompanyId(companyId);
        location.setWarehouseId(warehouseId);
        location.setIsActive(true);

        when(inventoryFeignClient.getLocationById(locationId, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(location)));

        assertDoesNotThrow(() -> inventoryValidationService.validateLocation(locationId, warehouseId, companyId));
    }
}
