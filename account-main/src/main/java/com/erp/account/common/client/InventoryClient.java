package com.erp.account.common.client;

import java.util.List;
import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import com.erp.account.common.dto.inventory.request.SalesInvoiceStockOutRequest;
import com.erp.account.common.dto.inventory.request.WarehouseAccountRequest;
import com.erp.account.common.dto.inventory.request.PurchaseInvoiceStockInRequest;
import com.erp.account.common.dto.inventory.request.DeliveryChallanStockOutRequest;
import com.erp.account.common.dto.inventory.response.ProductResponse;
import com.erp.account.common.dto.inventory.response.ProductDetailResponse;
import com.erp.account.common.dto.inventory.response.ProductStockIntegrationResponse;
import com.erp.account.common.dto.inventory.response.SalesInvoiceStockOutResponse;
import com.erp.account.common.dto.inventory.response.PurchaseInvoiceStockInResponse;
import com.erp.account.common.dto.inventory.response.DeliveryChallanStockOutResponse;
import com.erp.account.common.dto.inventory.response.WarehouseAccountResponse;
import com.erp.account.common.dto.request.ApiRequest;
import com.erp.account.common.dto.response.ApiResponse;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.validation.Valid;

import com.erp.account.common.config.FeignClientConfig;

@FeignClient(name = "inventoryClient", url = "${service.api.inventory}", configuration = FeignClientConfig.class)
public interface InventoryClient {

        @PostMapping("/api/inventory/integration/delivery-challan/stock-out")
        public ResponseEntity<ApiResponse<DeliveryChallanStockOutResponse>> createDeliveryChallanStockOut(
                        @Valid @RequestBody DeliveryChallanStockOutRequest request);

        @PostMapping("/api/inventory/integration/sales-invoice/stock-out")
        public ResponseEntity<ApiResponse<SalesInvoiceStockOutResponse>> createStockOut(
                        @Valid @RequestBody SalesInvoiceStockOutRequest request);

        @PostMapping("/api/inventory/integration/purchase-invoice/stock-in")
        public ResponseEntity<ApiResponse<PurchaseInvoiceStockInResponse>> createStockIn(
                        @Valid @RequestBody PurchaseInvoiceStockInRequest request);

        @GetMapping("/api/inventory/products/{id}")
        public ResponseEntity<ApiResponse<ProductDetailResponse>> getById(
                        @PathVariable UUID id,
                        @RequestParam(required = false) UUID companyId);

        @GetMapping("/api/inventory/products")
        public ResponseEntity<ApiResponse<List<ProductResponse>>> searchProducts(
                        @RequestParam(name = "companyId") UUID companyId,
                        @RequestParam(name = "productName", required = false) String productName,
                        @RequestParam(name = "productCode", required = false) String productCode,
                        @RequestParam(name = "sku", required = false) String sku,
                        @RequestParam(name = "searchKey", required = false) String searchKey);

        @PostMapping("/api/inventory/warehouses/getWarehouseAccount")
        public ResponseEntity<ApiResponse<WarehouseAccountResponse>> getWarehouseAccount(
                        @RequestBody ApiRequest<WarehouseAccountRequest> apiRequest);

        @GetMapping("/api/inventory/integration/stock/products")
        public ResponseEntity<ApiResponse<List<ProductStockIntegrationResponse>>> getGroupedStock(
                        @RequestParam(name = "companyId") UUID companyId,
                        @RequestParam(name = "productId") UUID productId);
}
