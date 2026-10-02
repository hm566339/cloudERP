package com.erp.account.modules.proformainvoice.controller.v2;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.proformainvoice.dto.response.v2.ProformaInvoiceV2Response;
import com.erp.account.modules.proformainvoice.service.v2.ProformaInvoiceQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/account/v2/proforma-invoices")
@RequiredArgsConstructor
@Tag(name = "Proforma Invoice V2 API", description = "Production-grade PI APIs")
public class ProformaInvoiceV2Controller {

    private final ProformaInvoiceQueryService piQueryService;

    @Operation(summary = "Get PI by ID", description = "Retrieves structured PI with nested details.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProformaInvoiceV2Response>> getProformaInvoice(
            @PathVariable UUID id,
            @RequestParam UUID companyId) { // Recommend extracting from JWT in future
        
        ProformaInvoiceV2Response response = piQueryService.getProformaInvoiceDetails(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Proforma invoice retrieved successfully"));
    }
}
