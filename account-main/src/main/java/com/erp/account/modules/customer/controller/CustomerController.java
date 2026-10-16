package com.erp.account.modules.customer.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.customer.dto.request.CustomerFilterDto;
import com.erp.account.modules.customer.dto.request.CustomerRequest;
import com.erp.account.modules.ledger.dto.response.CustomerLedgerResponse;
import com.erp.account.modules.customer.dto.response.CustomerResponse;
import com.erp.account.modules.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account/customers")
@Tag(name = "Customer Management", description = "Manage customer master data")
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @Operation(summary = "Create a new customer")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            @Valid @RequestBody RequestWrapper<CustomerRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        CustomerRequest request = requestWrapper.unwrap();
        log.info("Creating customer: {}", request.getCustomerCode());
        CustomerResponse response = customerService.createCustomer(requestWrapper, companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Customer created successfully", HttpStatus.CREATED));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing customer")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<CustomerRequest> requestWrapper) {
        log.info("Updating customer: {}", id);
        CustomerResponse response = customerService.updateCustomer(id, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Customer updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a customer (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable UUID id) {
        log.info("Deleting customer: {}", id);
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.<Void>success(null, "Customer deleted successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID with full profile")
    public ResponseEntity<ApiResponse<com.erp.account.modules.customer.dto.response.CustomerProfileResponse>> getCustomerById(
            @PathVariable UUID id) {
        log.info("Fetching customer profile: {}", id);
        com.erp.account.modules.customer.dto.response.CustomerProfileResponse response = customerService
                .getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Customer profile retrieved successfully"));
    }

    @GetMapping("/{id}/addresses")
    @Operation(summary = "Get customer addresses")
    public ResponseEntity<ApiResponse<java.util.List<com.erp.account.modules.customer.dto.response.CustomerAddressResponse>>> getCustomerAddresses(
            @PathVariable UUID id) {
        log.info("Fetching customer addresses: {}", id);
        com.erp.account.modules.customer.dto.response.CustomerProfileResponse response = customerService
                .getCustomerById(id);
        return ResponseEntity
                .ok(ApiResponse.success(response.getAddresses(), "Customer addresses retrieved successfully"));
    }

    @GetMapping
    @Operation(summary = "Get customers with optional filters and pagination")
    public ResponseEntity<ApiResponse<java.util.List<CustomerResponse>>> getAllCustomers(
            @ModelAttribute CustomerFilterDto filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            UUID companyId) {
        log.info("Fetching customers with filters: {}", filter);
        Page<CustomerResponse> page = customerService.getAllCustomers(filter, pageable, companyId);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Customers retrieved successfully"));
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate a customer")
    public ResponseEntity<ApiResponse<Void>> activateCustomer(@PathVariable UUID id) {
        log.info("Activating customer: {}", id);
        customerService.activateCustomer(id);
        return ResponseEntity.ok(ApiResponse.<Void>success(null, "Customer activated successfully"));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a customer")
    public ResponseEntity<ApiResponse<Void>> deactivateCustomer(@PathVariable UUID id) {
        log.info("Deactivating customer: {}", id);
        customerService.deactivateCustomer(id);
        return ResponseEntity.ok(ApiResponse.<Void>success(null, "Customer deactivated successfully"));
    }

    @GetMapping("/{id}/ledger")
    @Operation(summary = "Get customer ledger for a date range")
    public ResponseEntity<ApiResponse<CustomerLedgerResponse>> getCustomerLedger(
            @PathVariable UUID id,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        log.info("Fetching customer ledger for customer: {} from: {} to: {}", id, fromDate, toDate);
        CustomerLedgerResponse response = customerService.getCustomerLedger(id, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(response, "Customer ledger retrieved successfully"));
    }

    @GetMapping("/{id}/transactions")
    @Operation(summary = "Get customer transactions for a date range")
    public ResponseEntity<ApiResponse<CustomerLedgerResponse>> getCustomerTransactions(
            @PathVariable UUID id,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        log.info("Fetching customer transactions for customer: {} from: {} to: {}", id, fromDate, toDate);
        CustomerLedgerResponse response = customerService.getCustomerTransactions(id, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(response, "Customer transactions retrieved successfully"));
    }

}
