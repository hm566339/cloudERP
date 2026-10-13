package com.erp.account.modules.vendor.controller;

import com.erp.account.modules.vendor.dto.request.VendorRequest;
import com.erp.account.modules.vendor.dto.response.VendorResponse;
import com.erp.account.modules.vendor.dto.response.VendorAddressResponse;
import com.erp.account.modules.vendor.dto.request.VendorFilterDto;
import com.erp.account.modules.ledger.dto.response.VendorLedgerResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.vendor.service.VendorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/account/v1/vendors")
public class VendorController {

    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VendorResponse>> createVendor(
            @Valid @RequestBody RequestWrapper<VendorRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        VendorRequest request = requestWrapper.unwrap();
        log.info("POST /api/v1/vendors - Create vendor: {}", request.getVendorCode());
        VendorResponse response = vendorService.createVendor(companyId, requestWrapper);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Vendor created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VendorResponse>> updateVendor(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<VendorRequest> requestWrapper) {
        log.info("PUT /api/v1/vendors/{} - Update vendor", id);
        VendorResponse response = vendorService.updateVendor(id, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVendor(@PathVariable UUID id) {
        log.info("DELETE /api/v1/vendors/{} - Delete vendor", id);
        vendorService.deleteVendor(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Vendor deleted successfully"));
    }

    @GetMapping("/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Get vendor by ID with full profile")
    public ResponseEntity<ApiResponse<com.erp.account.modules.vendor.dto.response.VendorProfileResponse>> getVendorById(@PathVariable UUID id) {
        log.info("Fetching vendor profile: {}", id);
        com.erp.account.modules.vendor.dto.response.VendorProfileResponse response = vendorService.getVendorById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor profile retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VendorResponse>>> getAllVendors(
            @ModelAttribute VendorFilterDto filter,
            Pageable pageable) {
        log.info("GET /api/v1/vendors - Get all vendors with filter: {}", filter);
        Page<VendorResponse> vendors = vendorService.getAllVendors(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(vendors, "Vendors retrieved successfully"));
    }

    @GetMapping("/code/{vendorCode}")
    public ResponseEntity<ApiResponse<VendorResponse>> getVendorByCode(
            @PathVariable String vendorCode) {
        log.info("GET /api/v1/vendors/code/{} - Get vendor by code", vendorCode);
        VendorResponse response = vendorService.getVendorByCode(vendorCode);
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor retrieved successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<VendorResponse>>> searchVendors(
            @RequestParam String query,
            Pageable pageable) {
        log.info("GET /api/v1/vendors/search - Search vendors with query: {}", query);
        Page<VendorResponse> vendors = vendorService.searchVendors(query, pageable);
        return ResponseEntity.ok(ApiResponse.success(vendors, "Vendors retrieved successfully"));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<VendorResponse>>> getActiveVendors() {
        log.info("GET /api/v1/vendors/active - Get active vendors");
        List<VendorResponse> vendors = vendorService.getActiveVendors();
        return ResponseEntity.ok(ApiResponse.success(vendors, "Active vendors retrieved successfully"));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activateVendor(@PathVariable UUID id) {
        log.info("PUT /api/v1/vendors/{}/activate - Activate vendor", id);
        vendorService.activateVendor(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Vendor activated successfully"));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateVendor(@PathVariable UUID id) {
        log.info("PUT /api/v1/vendors/{}/deactivate - Deactivate vendor", id);
        vendorService.deactivateVendor(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Vendor deactivated successfully"));
    }

    @GetMapping("/{id}/ledger")
    public ResponseEntity<ApiResponse<VendorLedgerResponse>> getVendorLedger(
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        log.info("GET /api/v1/vendors/{}/ledger - Get vendor ledger from {} to {}", id, fromDate, toDate);
        VendorLedgerResponse ledger = vendorService.getVendorLedger(id, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(ledger, "Vendor ledger retrieved successfully"));
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<ApiResponse<VendorLedgerResponse>> getVendorTransactions(
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        log.info("GET /api/v1/vendors/{}/transactions - Get vendor transactions from {} to {}", id, fromDate, toDate);
        VendorLedgerResponse transactions = vendorService.getVendorTransactions(id, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(transactions, "Vendor transactions retrieved successfully"));
    }

    @GetMapping("/gstin/{gstin}")
    public ResponseEntity<ApiResponse<VendorResponse>> getVendorByGstin(
            @PathVariable String gstin) {
        log.info("GET /api/v1/vendors/gstin/{} - Get vendor by GSTIN", gstin);
        VendorResponse response = vendorService.getVendorByGstin(gstin);
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor retrieved successfully"));
    }

    @GetMapping("/pan/{pan}")
    public ResponseEntity<ApiResponse<VendorResponse>> getVendorByPan(
            @PathVariable String pan) {
        log.info("GET /api/v1/vendors/pan/{} - Get vendor by PAN", pan);
        VendorResponse response = vendorService.getVendorByPan(pan);
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor retrieved successfully"));
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<ApiResponse<Page<VendorResponse>>> getVendorsByCity(
            @PathVariable String city,
            Pageable pageable) {
        log.info("GET /api/v1/vendors/city/{} - Get vendors by city", city);
        Page<VendorResponse> vendors = vendorService.searchVendorsByCity(city, pageable);
        return ResponseEntity.ok(ApiResponse.success(vendors, "Vendors retrieved successfully"));
    }

    @GetMapping("/state/{state}")
    public ResponseEntity<ApiResponse<Page<VendorResponse>>> getVendorsByState(
            @PathVariable String state,
            Pageable pageable) {
        log.info("GET /api/v1/vendors/state/{} - Get vendors by state", state);
        Page<VendorResponse> vendors = vendorService.searchVendorsByState(state, pageable);
        return ResponseEntity.ok(ApiResponse.success(vendors, "Vendors retrieved successfully"));
    }

    @GetMapping("/country/{country}")
    public ResponseEntity<ApiResponse<Page<VendorResponse>>> getVendorsByCountry(
            @PathVariable String country,
            Pageable pageable) {
        log.info("GET /api/v1/vendors/country/{} - Get vendors by country", country);
        Page<VendorResponse> vendors = vendorService.searchVendorsByCountry(country, pageable);
        return ResponseEntity.ok(ApiResponse.success(vendors, "Vendors retrieved successfully"));
    }

    @GetMapping("/{id}/addresses")
    public ResponseEntity<ApiResponse<List<VendorAddressResponse>>> getVendorAddresses(@PathVariable UUID id) {
        log.info("GET /api/account/v1/vendors/{}/addresses - Get vendor addresses", id);
        List<VendorAddressResponse> response = vendorService.getVendorAddresses(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor addresses retrieved successfully"));
    }
}
