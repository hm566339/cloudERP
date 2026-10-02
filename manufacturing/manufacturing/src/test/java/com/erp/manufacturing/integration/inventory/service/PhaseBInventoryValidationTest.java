package com.erp.manufacturing.integration.inventory.service;

import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.common.exception.ResourceNotFoundException;
import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductInventoryInfo;
import com.erp.manufacturing.integration.inventory.dto.ProductInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductUomInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.UnitOfMeasureInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.WarehouseInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.WarehouseLocationInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.BomInventoryValidationRequest;
import com.erp.manufacturing.integration.inventory.dto.BomItemInventoryReference;
import com.erp.manufacturing.integration.inventory.dto.BomOutputInventoryReference;
import com.erp.manufacturing.integration.inventory.dto.ProductionOrderInventoryValidationRequest;
import com.erp.manufacturing.integration.inventory.dto.ProductionOrderMaterialInventoryReference;
import com.erp.manufacturing.integration.inventory.dto.ProductionOrderOutputInventoryReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PhaseBInventoryValidationTest {

    @Mock
    private InventoryFeignClient inventoryFeignClient;

    private InventoryValidationService inventoryValidationService;

    private BomInventoryValidationService bomInventoryValidationService;

    private ProductionOrderInventoryValidationService productionOrderInventoryValidationService;

    @BeforeEach
    void setUp() {
        inventoryValidationService = new InventoryValidationService(inventoryFeignClient);
        bomInventoryValidationService = new BomInventoryValidationService(inventoryValidationService);
        productionOrderInventoryValidationService = new ProductionOrderInventoryValidationService(inventoryValidationService);
    }

    @Test
    void validateProduct_acceptsValidProduct() {
        UUID companyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        stubProduct(productId, companyId, "ACTIVE");
        assertDoesNotThrow(() -> inventoryValidationService.validateProduct(productId, companyId));
    }

    @Test
    void validateProduct_rejectsInactiveProduct() {
        UUID companyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        stubProduct(productId, companyId, "INACTIVE");
        assertThrows(BusinessValidationException.class,
                () -> inventoryValidationService.validateProduct(productId, companyId));
    }

    @Test
    void validateProduct_rejectsMissingProduct() {
        UUID companyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        when(inventoryFeignClient.getProductById(productId, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.<ProductInventoryResponse>builder()
                        .success(false).data(null).build()));
        assertThrows(ResourceNotFoundException.class,
                () -> inventoryValidationService.validateProduct(productId, companyId));
    }

    @Test
    void validateProduct_rejectsCrossCompanyProduct() {
        UUID companyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        ProductInventoryInfo info = new ProductInventoryInfo();
        info.setStatus("ACTIVE");
        ProductInventoryResponse product = new ProductInventoryResponse();
        product.setId(productId); product.setCompanyId(UUID.randomUUID()); product.setProduct(info);
        when(inventoryFeignClient.getProductById(productId, companyId))
            .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(product)));
        assertThrows(BusinessValidationException.class,
                () -> inventoryValidationService.validateProduct(productId, companyId));
    }

    @Test
    void validateUom_acceptsValidUom() {
        UUID companyId = UUID.randomUUID();
        UUID uomId = UUID.randomUUID();
        stubUom(uomId, companyId, true);
        assertDoesNotThrow(() -> inventoryValidationService.validateUom(uomId, companyId));
    }

    @Test
    void validateUom_rejectsInactiveUom() {
        UUID companyId = UUID.randomUUID();
        UUID uomId = UUID.randomUUID();
        stubUom(uomId, companyId, false);
        assertThrows(BusinessValidationException.class,
                () -> inventoryValidationService.validateUom(uomId, companyId));
    }

    @Test
    void validateUom_rejectsMissingUom() {
        UUID companyId = UUID.randomUUID();
        UUID uomId = UUID.randomUUID();
        when(inventoryFeignClient.getUnitOfMeasureById(uomId, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.<UnitOfMeasureInventoryResponse>builder()
                        .success(false).data(null).build()));
        assertThrows(ResourceNotFoundException.class,
                () -> inventoryValidationService.validateUom(uomId, companyId));
    }

    @Test
    void validateUom_rejectsIncompatibleProductUom() {
        UUID companyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID uomId = UUID.randomUUID();
        stubProduct(productId, companyId, "ACTIVE");
        stubUom(uomId, companyId, true);
        when(inventoryFeignClient.getProductUoms(productId, uomId, companyId, 0, 1))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(List.of())));
        assertThrows(BusinessValidationException.class,
                () -> inventoryValidationService.validateProductUom(productId, uomId, companyId));
    }

    @Test
    void validateUom_rejectsCrossCompanyUom() {
        UUID companyId = UUID.randomUUID();
        UUID uomId = UUID.randomUUID();
        UnitOfMeasureInventoryResponse uom = new UnitOfMeasureInventoryResponse();
        uom.setId(uomId); uom.setCompanyId(UUID.randomUUID()); uom.setIsActive(true);
        when(inventoryFeignClient.getUnitOfMeasureById(uomId, companyId))
            .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(uom)));
        assertThrows(BusinessValidationException.class,
                () -> inventoryValidationService.validateUom(uomId, companyId));
    }

    @Test
    void validateWarehouse_acceptsValidWarehouse() {
        UUID companyId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        WarehouseInventoryResponse warehouse = new WarehouseInventoryResponse();
        warehouse.setId(warehouseId); warehouse.setCompanyId(companyId); warehouse.setStatus("ACTIVE");
        when(inventoryFeignClient.getWarehouseById(warehouseId, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(warehouse)));
        assertDoesNotThrow(() -> inventoryValidationService.validateWarehouse(warehouseId, companyId));
    }

    @Test
    void validateWarehouse_rejectsInvalidOrCrossCompanyWarehouse() {
        UUID companyId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        WarehouseInventoryResponse warehouse = new WarehouseInventoryResponse();
        warehouse.setId(warehouseId); warehouse.setCompanyId(UUID.randomUUID()); warehouse.setStatus("ACTIVE");
        when(inventoryFeignClient.getWarehouseById(warehouseId, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(warehouse)));
        assertThrows(BusinessValidationException.class,
                () -> inventoryValidationService.validateWarehouse(warehouseId, companyId));
    }

    @Test
    void validateLocation_acceptsValidLocation() {
        UUID companyId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        UUID locationId = UUID.randomUUID();
        stubLocation(locationId, companyId, warehouseId, true);
        assertDoesNotThrow(() -> inventoryValidationService.validateLocation(locationId, warehouseId, companyId));
    }

    @Test
    void validateLocation_rejectsInvalidOrCrossCompanyLocation() {
        UUID companyId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        UUID locationId = UUID.randomUUID();
        stubLocation(locationId, companyId, warehouseId, true);
        when(inventoryFeignClient.getLocationById(locationId, companyId))
            .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(locationWithCompany(
                locationId, UUID.randomUUID(), warehouseId))));
        assertThrows(BusinessValidationException.class,
                () -> inventoryValidationService.validateLocation(locationId, warehouseId, companyId));
    }

    @Test
    void validateBom_acceptsValidReferences() {
        UUID companyId = UUID.randomUUID();
        UUID finishedProductId = UUID.randomUUID();
        UUID componentProductId = UUID.randomUUID();
        UUID uomId = UUID.randomUUID();
        stubProduct(finishedProductId, companyId, "ACTIVE");
        stubProduct(componentProductId, companyId, "ACTIVE");
        stubUom(uomId, companyId, true);
        stubCompatible(componentProductId, uomId, companyId);
        assertDoesNotThrow(() -> bomInventoryValidationService.validate(requestBom(companyId, finishedProductId,
                componentProductId, uomId, componentProductId, uomId)));
    }

    @Test
    void validateBom_rejectsInvalidReference() {
        UUID companyId = UUID.randomUUID();
        UUID finishedProductId = UUID.randomUUID();
        UUID componentProductId = UUID.randomUUID();
        UUID uomId = UUID.randomUUID();
        stubProduct(finishedProductId, companyId, "ACTIVE");
        stubProduct(componentProductId, companyId, "INACTIVE");
        assertThrows(BusinessValidationException.class,
                () -> bomInventoryValidationService.validate(requestBom(companyId, finishedProductId,
                        componentProductId, uomId, componentProductId, uomId)));
    }

    @Test
    void validateProductionOrder_acceptsValidReferences() {
        UUID companyId = UUID.randomUUID();
        UUID finishedProductId = UUID.randomUUID();
        UUID materialProductId = UUID.randomUUID();
        UUID outputProductId = UUID.randomUUID();
        UUID uomId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        UUID locationId = UUID.randomUUID();
        stubProduct(finishedProductId, companyId, "ACTIVE");
        stubProduct(materialProductId, companyId, "ACTIVE");
        stubProduct(outputProductId, companyId, "ACTIVE");
        stubUom(uomId, companyId, true);
        stubCompatible(materialProductId, uomId, companyId);
        stubCompatible(outputProductId, uomId, companyId);
        stubWarehouse(warehouseId, companyId);
        stubLocation(locationId, companyId, warehouseId, true);
        assertDoesNotThrow(() -> productionOrderInventoryValidationService.validate(requestOrder(companyId,
                finishedProductId, warehouseId, locationId, materialProductId, outputProductId, uomId)));
    }

    @Test
    void validateProductionOrder_rejectsInvalidReference() {
        UUID companyId = UUID.randomUUID();
        UUID finishedProductId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        stubProduct(finishedProductId, companyId, "ACTIVE");
        stubWarehouse(warehouseId, companyId);
        assertThrows(ResourceNotFoundException.class,
                () -> productionOrderInventoryValidationService.validate(requestOrder(companyId, finishedProductId,
                        warehouseId, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID())));
    }

    private void stubProduct(UUID id, UUID companyId, String status) {
        ProductInventoryInfo info = new ProductInventoryInfo();
        info.setStatus(status);
        ProductInventoryResponse product = new ProductInventoryResponse();
        product.setId(id); product.setCompanyId(companyId); product.setProduct(info);
        when(inventoryFeignClient.getProductById(id, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(product)));
    }

    private void stubUom(UUID id, UUID companyId, boolean active) {
        UnitOfMeasureInventoryResponse uom = new UnitOfMeasureInventoryResponse();
        uom.setId(id); uom.setCompanyId(companyId); uom.setIsActive(active);
        when(inventoryFeignClient.getUnitOfMeasureById(id, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(uom)));
    }

    private void stubCompatible(UUID productId, UUID uomId, UUID companyId) {
        ProductUomInventoryResponse mapping = new ProductUomInventoryResponse();
        mapping.setProductId(productId); mapping.setUomId(uomId); mapping.setCompanyId(companyId); mapping.setIsDeleted(false);
        when(inventoryFeignClient.getProductUoms(productId, uomId, companyId, 0, 1))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(List.of(mapping))));
    }

    private void stubWarehouse(UUID id, UUID companyId) {
        WarehouseInventoryResponse warehouse = new WarehouseInventoryResponse();
        warehouse.setId(id); warehouse.setCompanyId(companyId); warehouse.setStatus("ACTIVE");
        when(inventoryFeignClient.getWarehouseById(id, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(warehouse)));
    }

    private void stubLocation(UUID id, UUID companyId, UUID warehouseId, boolean active) {
        WarehouseLocationInventoryResponse location = new WarehouseLocationInventoryResponse();
        location.setId(id); location.setCompanyId(companyId); location.setWarehouseId(warehouseId); location.setIsActive(active);
        when(inventoryFeignClient.getLocationById(id, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(location)));
    }

    private WarehouseLocationInventoryResponse locationWithCompany(UUID id, UUID companyId, UUID warehouseId) {
        WarehouseLocationInventoryResponse location = new WarehouseLocationInventoryResponse();
        location.setId(id); location.setCompanyId(companyId); location.setWarehouseId(warehouseId); location.setIsActive(true);
        return location;
    }

    private BomInventoryValidationRequest requestBom(UUID companyId, UUID finishedProductId, UUID componentProductId,
                                                     UUID componentUomId, UUID outputProductId, UUID outputUomId) {
        BomInventoryValidationRequest request = new BomInventoryValidationRequest();
        request.setCompanyId(companyId); request.setFinishedProductId(finishedProductId);
        BomItemInventoryReference item = new BomItemInventoryReference();
        item.setProductId(componentProductId); item.setUomId(componentUomId);
        BomOutputInventoryReference output = new BomOutputInventoryReference();
        output.setProductId(outputProductId); output.setUomId(outputUomId);
        request.setItems(List.of(item)); request.setOutputs(List.of(output));
        return request;
    }

    private ProductionOrderInventoryValidationRequest requestOrder(UUID companyId, UUID finishedProductId,
            UUID warehouseId, UUID locationId, UUID materialProductId, UUID outputProductId, UUID uomId) {
        ProductionOrderInventoryValidationRequest request = new ProductionOrderInventoryValidationRequest();
        request.setCompanyId(companyId); request.setFinishedProductId(finishedProductId);
        request.setWarehouseId(warehouseId); request.setProductionLocationId(locationId);
        ProductionOrderMaterialInventoryReference material = new ProductionOrderMaterialInventoryReference();
        material.setProductId(materialProductId); material.setUomId(uomId);
        ProductionOrderOutputInventoryReference output = new ProductionOrderOutputInventoryReference();
        output.setProductId(outputProductId); output.setUomId(uomId); output.setWarehouseId(warehouseId); output.setLocationId(locationId);
        request.setMaterials(List.of(material)); request.setOutputs(List.of(output));
        return request;
    }
}
