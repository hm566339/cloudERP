package com.erp.account.modules.proformainvoice.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.proformainvoice.dto.request.PIConversionRequest;
import com.erp.account.modules.proformainvoice.dto.request.ProformaInvoiceDirectCreateRequest;
import com.erp.account.modules.proformainvoice.dto.request.PIUpdateRequest;
import com.erp.account.modules.proformainvoice.dto.request.PIFilterDto;
import com.erp.account.modules.proformainvoice.dto.response.ProformaInvoiceResponse;
import com.erp.account.modules.proformainvoice.dto.response.profile.ProformaInvoiceProfileResponse;
import com.erp.account.modules.proformainvoice.service.ProformaInvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/account/v1/proforma-invoices")
@RequiredArgsConstructor
@Tag(name = "Proforma Invoice API", description = "Proforma Invoice management with strict lifecycle rules")
public class ProformaInvoiceController {

    private final ProformaInvoiceService proformaInvoiceService;

    @Operation(summary = "Create Proforma Invoice from Quotation", description = "Only ACCEPTED quotations can be converted into a Proforma Invoice.")
    @PostMapping("/from-quotation/{quotationId}")
    public ResponseEntity<ApiResponse<ProformaInvoiceResponse>> createFromQuotation(
            @PathVariable UUID quotationId,
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<PIConversionRequest> requestWrapper) {
        log.info("===== CREATE PI CONTROLLER ===== quotationId = {}, companyId = {}, requestWrapper = {}",
                quotationId, companyId, requestWrapper);
        PIConversionRequest request = requestWrapper.unwrap();
        log.info("===== CREATE PI CONTROLLER UNWRAPPED ===== request = {}", request);
        ProformaInvoiceResponse response = proformaInvoiceService.createFromQuotation(companyId, quotationId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Proforma Invoice created successfully"));
    }

    @Operation(summary = "Create Direct Proforma Invoice", description = "Creates a Proforma Invoice directly from customer and item data without requiring a quotation.")
    @PostMapping("/direct")
    public ResponseEntity<ApiResponse<ProformaInvoiceResponse>> createDirectProformaInvoice(
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<ProformaInvoiceDirectCreateRequest> requestWrapper) {
        log.info("===== CREATE DIRECT PI CONTROLLER ===== companyId = {}, requestWrapper = {}",
                companyId, requestWrapper);
        ProformaInvoiceDirectCreateRequest request = requestWrapper.unwrap();
        log.info("===== CREATE DIRECT PI CONTROLLER UNWRAPPED ===== request = {}", request);
        ProformaInvoiceResponse response = proformaInvoiceService.createDirectProformaInvoice(companyId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Direct Proforma Invoice created successfully"));
    }

    @Operation(summary = "Get All Proforma Invoices")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProformaInvoiceResponse>>> getAllProformaInvoices(
            @RequestParam(required = false) UUID companyId,
            @ModelAttribute PIFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
            
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);

        String[] sortParams = sort.split(",", 2);
        String sortProperty = "createdAt";
        String sortDirection = "desc";

        if (sortParams.length == 1) {
            String candidate = sortParams[0].trim();
            if ("asc".equalsIgnoreCase(candidate) || "desc".equalsIgnoreCase(candidate)) {
                sortDirection = candidate;
            } else if (!candidate.isBlank()) {
                sortProperty = candidate;
            }
        } else {
            if (!sortParams[0].isBlank()) {
                sortProperty = sortParams[0].trim();
            }
            if (!sortParams[1].isBlank()) {
                // If sort string contains multiple desc (e.g. desc,desc), split grabs the first part correctly
                // but we should just ensure it resolves to asc or desc.
                String candidateDir = sortParams[1].split(",")[0].trim();
                if ("asc".equalsIgnoreCase(candidateDir) || "desc".equalsIgnoreCase(candidateDir)) {
                    sortDirection = candidateDir;
                }
            }
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable safePageable = PageRequest.of(safePage, safeSize, Sort.by(direction, sortProperty));

        Page<ProformaInvoiceResponse> response = proformaInvoiceService.getAllProformaInvoices(companyId, filter, safePageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Proforma Invoices retrieved successfully"));
    }

    @Operation(summary = "Get Proforma Invoice by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProformaInvoiceProfileResponse>> getProformaInvoiceById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ProformaInvoiceProfileResponse response = proformaInvoiceService.getProformaInvoiceById(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Proforma Invoice retrieved successfully"));
    }

    @Operation(summary = "Get Proforma Invoice by Number")
    @GetMapping("/number/{piNumber}")
    public ResponseEntity<ApiResponse<ProformaInvoiceProfileResponse>> getProformaInvoiceByNumber(
            @PathVariable String piNumber,
            @RequestParam(required = false) UUID companyId) {
        ProformaInvoiceProfileResponse response = proformaInvoiceService.getProformaInvoiceByNumber(companyId, piNumber);
        return ResponseEntity.ok(ApiResponse.success(response, "Proforma Invoice retrieved successfully"));
    }

    @Operation(summary = "Update Proforma Invoice", description = "Only DRAFT Proforma Invoices can be edited. Backend recalculates all commercial fields.")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProformaInvoiceResponse>> updateProformaInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<PIUpdateRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        PIUpdateRequest request = requestWrapper.unwrap();
        ProformaInvoiceResponse response = proformaInvoiceService.updateProformaInvoice(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Proforma Invoice updated successfully"));
    }

    @Operation(summary = "Send Proforma Invoice", description = "Transitions DRAFT to ISSUED.")
    @PostMapping("/{id}/send")
    public ResponseEntity<ApiResponse<ProformaInvoiceResponse>> sendPI(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ProformaInvoiceResponse response = proformaInvoiceService.sendPI(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Proforma Invoice sent successfully"));
    }

    @Operation(summary = "Confirm Proforma Invoice", description = "Transitions ISSUED to CONFIRMED. Locks document.")
    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<ProformaInvoiceResponse>> confirmPI(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ProformaInvoiceResponse response = proformaInvoiceService.confirmPI(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Proforma Invoice confirmed successfully"));
    }

    @Operation(summary = "Cancel Proforma Invoice", description = "Transitions to CANCELLED. Terminal state.")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<ProformaInvoiceResponse>> cancelPI(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ProformaInvoiceResponse response = proformaInvoiceService.cancelPI(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Proforma Invoice cancelled successfully"));
    }

    @Operation(summary = "Delete Proforma Invoice", description = "Soft deletes a Proforma Invoice. Only DRAFT PIs can be deleted.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProformaInvoice(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        proformaInvoiceService.deleteProformaInvoice(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Proforma Invoice deleted successfully"));
    }
}
