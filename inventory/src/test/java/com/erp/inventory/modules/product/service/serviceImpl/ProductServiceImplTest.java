package com.erp.inventory.modules.product.service.serviceImpl;

import com.erp.inventory.modules.product.dto.response.ProductDetailResponse;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.repository.ProductCategoryRepository;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryStockRepository inventoryStockRepository;

    @Mock
    private ProductCategoryRepository categoryRepository;

    @Mock
    private UnitOfMeasureRepository uomRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private UUID companyId;
    private UUID productId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        productId = UUID.randomUUID();
        com.erp.inventory.common.security.CurrentUserContext.setCompanyId(companyId);
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        com.erp.inventory.common.security.CurrentUserContext.clear();
    }

    @Test
    void getProductDetailById_shouldAggregateStockFromMultipleWarehouses() {
        Product product = new Product();
        product.setId(productId);
        product.setCompanyId(companyId);
        
        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));

        UUID warehouse1 = UUID.randomUUID();
        UUID warehouse2 = UUID.randomUUID();
        UUID warehouse3 = UUID.randomUUID();

        Warehouse w1 = new Warehouse(); w1.setWarehouseName("Main Warehouse");
        Warehouse w2 = new Warehouse(); w2.setWarehouseName("Delhi Warehouse");
        Warehouse w3 = new Warehouse(); w3.setWarehouseName("Mumbai Warehouse");

        InventoryStock stock1 = new InventoryStock();
        stock1.setWarehouseId(warehouse1);
        stock1.setWarehouse(w1);
        stock1.setQuantity(new BigDecimal("96"));

        InventoryStock stock2 = new InventoryStock();
        stock2.setWarehouseId(warehouse2);
        stock2.setWarehouse(w2);
        stock2.setQuantity(new BigDecimal("40"));

        InventoryStock stock3 = new InventoryStock();
        stock3.setWarehouseId(warehouse3);
        stock3.setWarehouse(w3);
        stock3.setQuantity(new BigDecimal("25"));

        InventoryStock stock1_location2 = new InventoryStock();
        stock1_location2.setWarehouseId(warehouse1);
        stock1_location2.setWarehouse(w1);
        stock1_location2.setQuantity(new BigDecimal("4"));

        when(inventoryStockRepository.findByProductIdAndCompanyId(productId, companyId))
                .thenReturn(Optional.of(stock1));
        when(inventoryStockRepository.findAllByProductIdAndCompanyId(productId, companyId))
                .thenReturn(List.of(stock1, stock2, stock3, stock1_location2));

        ProductDetailResponse response = productService.getProductDetailById(productId, companyId);

        assertEquals(3, response.getStockSummary().getWarehouseCount());
        assertEquals(new BigDecimal("165"), response.getStockSummary().getTotalQuantity());
        
        assertEquals(3, response.getWarehouses().size());
        
        var w1Response = response.getWarehouses().stream().filter(w -> w.getWarehouseId().equals(warehouse1)).findFirst().get();
        assertEquals(new BigDecimal("100"), w1Response.getInventory().getQuantity());
        
        var w2Response = response.getWarehouses().stream().filter(w -> w.getWarehouseId().equals(warehouse2)).findFirst().get();
        assertEquals(new BigDecimal("40"), w2Response.getInventory().getQuantity());
    }
}
