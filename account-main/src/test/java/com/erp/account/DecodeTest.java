package com.erp.account;

import com.erp.account.common.dto.inventory.response.ProductStockIntegrationResponse;
import com.erp.account.common.dto.response.ApiResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;

public class DecodeTest {
    @Test
    public void testDecode() throws Exception {
        String json = """
{
  "success": true,
  "message": "Stock data fetched successfully",
  "data": [
    {
      "productId": "f115afa2-d7ee-446a-8422-8312a993c103",
      "productName": "Premium Ice Cream Freezer 300L",
      "totalQuantity": 10.000000,
      "availableQuantity": 10.000000,
      "hsnSacId": "9a05e8cd-770f-4abe-b450-ce15a06dd1fb",
      "hsnSacCode": "84185000",
      "hsnSacName": "VRX 1200 (GLASS)",
      "sellingPrice": 45000.00,
      "purchasePrice": 32000.00,
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
  "timestamp": "2026-08-24T23:06:40.7992366",
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
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.findAndRegisterModules();
            ApiResponse<List<ProductStockIntegrationResponse>> response = mapper.readValue(json, new TypeReference<>() {});
            System.out.println("SUCCESS: " + response.getData().size());
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
