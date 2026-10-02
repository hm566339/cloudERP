package com.erp.account.modules.integration.inventory.service;

import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.inventory.response.ProductStockIntegrationResponse;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.SalesInvoiceApprovalException;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryIntegrationServiceTest {

    @Mock
    private InventoryClient inventoryClient;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private InventoryIntegrationService service;

    private ObjectMapper realMapper;

    private static final String JSON_RESPONSE = """
            {
              "success": true,
              "message": "Stock data fetched successfully",
              "data": [
                {
                  "productId": "f115afa2-d7ee-446a-8422-8312a993c103",
                  "productName": "Premium Ice Cream Freezer 300L",
                  "totalQuantity": 10.000000,
                  "availableQuantity": 10.000000,
                  "baseUomId": "234e93b7-e97c-47c5-96ce-8078c69969d9",
                  "baseUomCode": "PIE0826001",
                  "baseUomName": "Pieces",
                  "warehouses": [
                    {
                      "warehouseId": "fdae1e76-82e9-4780-bbef-4937e7c32f1b",
                      "warehouseName": "kasera",
                      "totalQuantity": 10.000000,
                      "availableQuantity": 10.000000,
                      "locations": [
                        {
                          "locationId": "ff9293d2-d3eb-48de-b6f9-26c27dae3ae2",
                          "locationName": "kasera - patna ",
                          "batchId": null,
                          "batchCode": null,
                          "quantity": 10.000000,
                          "reservedQuantity": 0.000000,
                          "availableQuantity": 10.000000
                        }
                      ]
                    }
                  ]
                }
              ],
              "status": 200,
              "timestamp": "2026-08-24T22:58:33.5795397",
              "pagination": {
                "hasNext": false,
                "hasPrevious": false,
                "page": 1,
                "size": 10,
                "totalElements": 1,
                "totalPages": 1
              }
            }
            """;

    @BeforeEach
    void setUp() {
        realMapper = new ObjectMapper();
        realMapper.findAndRegisterModules();
    }

    @Test
    void testDeserializationAndValidation_Success() throws Exception {
        // 1. Test Deserialization matches exactly
        ApiResponse<List<ProductStockIntegrationResponse>> parsedResponse = realMapper.readValue(JSON_RESPONSE, new TypeReference<>() {});
        
        assertNotNull(parsedResponse);
        assertTrue(parsedResponse.isSuccess());
        assertEquals(1, parsedResponse.getData().size());
        assertEquals(UUID.fromString("f115afa2-d7ee-446a-8422-8312a993c103"), parsedResponse.getData().get(0).getProductId());
        assertEquals(new BigDecimal("10.000000"), parsedResponse.getData().get(0).getAvailableQuantity());
        
        assertNotNull(parsedResponse.getPagination());
        assertEquals(1, parsedResponse.getPagination().getPage());
        assertEquals(10, parsedResponse.getPagination().getSize());
        assertEquals(1, parsedResponse.getPagination().getTotalElements());
        assertEquals(1, parsedResponse.getPagination().getTotalPages());

        // 2. Test Validation logic - Requested 1 -> PASS
        when(inventoryClient.getGroupedStock(any(), any())).thenReturn(ResponseEntity.ok(parsedResponse));

        SalesInvoice invoice = new SalesInvoice();
        invoice.setId(UUID.randomUUID());
        invoice.setInvoiceNumber("INV-001");
        invoice.setCompanyId(UUID.randomUUID());
        
        SalesInvoiceItem item = new SalesInvoiceItem();
        item.setItemName("Premium Ice Cream Freezer 300L");
        item.setItemId(UUID.fromString("f115afa2-d7ee-446a-8422-8312a993c103"));
        item.setQuantity(new BigDecimal("1.0000"));
        item.setWarehouseId(UUID.fromString("fdae1e76-82e9-4780-bbef-4937e7c32f1b"));
        item.setLocationId(UUID.fromString("ff9293d2-d3eb-48de-b6f9-26c27dae3ae2"));
        item.setIsDeleted(false);
        
        invoice.setSalesInvoiceItems(new HashSet<>(List.of(item)));

        assertDoesNotThrow(() -> service.validateStockAvailability(invoice));
    }

    @Test
    void testValidation_ExactQuantity_Success() throws Exception {
        ApiResponse<List<ProductStockIntegrationResponse>> parsedResponse = realMapper.readValue(JSON_RESPONSE, new TypeReference<>() {});
        when(inventoryClient.getGroupedStock(any(), any())).thenReturn(ResponseEntity.ok(parsedResponse));

        SalesInvoice invoice = new SalesInvoice();
        SalesInvoiceItem item = new SalesInvoiceItem();
        item.setItemName("Premium Ice Cream Freezer 300L");
        item.setItemId(UUID.fromString("f115afa2-d7ee-446a-8422-8312a993c103"));
        item.setQuantity(new BigDecimal("10.000000")); // Requested 10
        item.setWarehouseId(UUID.fromString("fdae1e76-82e9-4780-bbef-4937e7c32f1b"));
        item.setLocationId(UUID.fromString("ff9293d2-d3eb-48de-b6f9-26c27dae3ae2"));
        item.setIsDeleted(false);
        invoice.setSalesInvoiceItems(new HashSet<>(List.of(item)));

        assertDoesNotThrow(() -> service.validateStockAvailability(invoice));
    }

    @Test
    void testValidation_InsufficientQuantity_Fail() throws Exception {
        ApiResponse<List<ProductStockIntegrationResponse>> parsedResponse = realMapper.readValue(JSON_RESPONSE, new TypeReference<>() {});
        when(inventoryClient.getGroupedStock(any(), any())).thenReturn(ResponseEntity.ok(parsedResponse));

        SalesInvoice invoice = new SalesInvoice();
        SalesInvoiceItem item = new SalesInvoiceItem();
        item.setItemName("Premium Ice Cream Freezer 300L");
        item.setItemId(UUID.fromString("f115afa2-d7ee-446a-8422-8312a993c103"));
        item.setQuantity(new BigDecimal("11.000000")); // Requested 11
        item.setWarehouseId(UUID.fromString("fdae1e76-82e9-4780-bbef-4937e7c32f1b"));
        item.setLocationId(UUID.fromString("ff9293d2-d3eb-48de-b6f9-26c27dae3ae2"));
        item.setIsDeleted(false);
        invoice.setSalesInvoiceItems(new HashSet<>(List.of(item)));

        SalesInvoiceApprovalException ex = assertThrows(SalesInvoiceApprovalException.class, () -> service.validateStockAvailability(invoice));
        assertTrue(ex.getMessage().contains("Insufficient stock"));
    }
}
