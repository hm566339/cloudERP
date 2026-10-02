package com.erp.account.modules.salesorder.controller.v2;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.salesorder.dto.response.v2.SalesOrderV2Response;
import com.erp.account.modules.salesorder.service.v2.SalesOrderQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/account/v2/sales-orders")
@RequiredArgsConstructor
@Tag(name = "Sales Order V2 API", description = "Production-grade Sales Order management APIs with structured responses")
public class SalesOrderV2Controller {

    private final SalesOrderQueryService salesOrderQueryService;
    private final com.erp.account.modules.salesorder.service.SalesOrderService salesOrderService;

    @Operation(summary = "Get Sales Order by ID", description = "Retrieve a structured, enterprise-grade Sales Order by ID, including nested items, taxes, pricing, and explicitly typed source origins.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Detailed Sales Order structure")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Sales Order not found")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SalesOrderV2Response>> getSalesOrderById(
            @Parameter(description = "Sales Order ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {

        SalesOrderV2Response response = salesOrderQueryService.getSalesOrderById(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales Order retrieved successfully"));
    }

}
