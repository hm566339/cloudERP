package com.erp.account.modules.invoicetax.controller;

import com.erp.account.modules.invoicetax.dto.InvoiceTaxRequest;
import com.erp.account.modules.invoicetax.dto.InvoiceTaxResponse;
import com.erp.account.modules.invoicetax.service.InvoiceTaxService;
import com.erp.account.util.Invoice;
import com.erp.account.util.TenantUtils;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
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

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.invoicetax.entity.InvoiceTax;
import com.erp.account.modules.invoicetax.dto.InvoiceTaxFilterDto;


@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account/sales/invoices/{invoiceId}/taxes")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Invoice Taxes", description = "Invoice tax management APIs")
public class InvoiceTaxController {

    private final InvoiceTaxService invoiceTaxService;


    @PostMapping
    @Operation(summary = "Create invoice tax", description = "Create a new tax breakdown entry for a sales invoice")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Invoice tax created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Company mismatch or access denied"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Sales invoice or GST slab not found")
    })
    public ResponseEntity<InvoiceTaxResponse> createInvoiceTax(
            @PathVariable UUID invoiceId,
            @Valid @RequestBody RequestWrapper<InvoiceTaxRequest> requestWrapper, @RequestParam(required = false) UUID companyId) {
        InvoiceTaxRequest request = requestWrapper.unwrap();
        log.info("REST: Creating invoice tax for invoice {} company {}", invoiceId, companyId);
        InvoiceTaxResponse response = invoiceTaxService.createInvoiceTax(invoiceId, requestWrapper, companyId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{taxId}")
    @Operation(summary = "Update invoice tax", description = "Update an existing tax breakdown entry for a sales invoice")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Invoice tax updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Company mismatch or access denied"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Invoice tax or sales invoice not found")
    })
    public ResponseEntity<InvoiceTaxResponse> updateInvoiceTax(
            @PathVariable UUID invoiceId,
            @PathVariable UUID taxId,
            @Valid @RequestBody RequestWrapper<InvoiceTaxRequest> requestWrapper, @RequestParam(required = false) UUID companyId) {
        InvoiceTaxRequest request = requestWrapper.unwrap();
        log.info("REST: Updating invoice tax {} for invoice {} company {}", taxId, invoiceId, companyId);
        InvoiceTaxResponse response = invoiceTaxService.updateInvoiceTax(invoiceId, taxId, requestWrapper, companyId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{taxId}")
    @Operation(summary = "Get invoice tax detail", description = "Retrieve a single tax breakdown entry for a sales invoice")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Invoice tax retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Company mismatch or access denied"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Invoice tax not found")
    })
    public ResponseEntity<InvoiceTaxResponse> getInvoiceTax(
            @PathVariable UUID invoiceId,
            @PathVariable UUID taxId,
            @RequestParam(required = false) UUID companyId) {
        log.info("REST: Fetching invoice tax {} for invoice {} company {}", taxId, invoiceId, companyId);
        InvoiceTaxResponse response = invoiceTaxService.getInvoiceTax(invoiceId, taxId, companyId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "List invoice taxes", description = "Retrieve invoice tax entries for a specific sales invoice")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Invoice taxes retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Company mismatch or access denied"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Sales invoice not found")
    })
    public ResponseEntity<Page<InvoiceTaxResponse>> listInvoiceTaxes(
            @PathVariable UUID invoiceId,
            @ModelAttribute InvoiceTaxFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        log.info("REST: Listing invoice taxes with pagination for invoice {}", invoiceId);
        
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, resolvedSortBy));
        
        Page<InvoiceTaxResponse> response = invoiceTaxService.getInvoiceTaxes(invoiceId, filter, pageable);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{taxId}")
    @Operation(summary = "Delete invoice tax", description = "Soft delete a tax breakdown entry for a sales invoice")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "Invoice tax deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Company mismatch or access denied"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Invoice tax not found")
    })
    public ResponseEntity<Void> deleteInvoiceTax(
            @PathVariable UUID invoiceId,
            @PathVariable UUID taxId, @RequestParam(required = false) UUID companyId) {
        log.info("REST: Deleting invoice tax {} for invoice {} company {}", taxId, invoiceId, companyId);
        invoiceTaxService.deleteInvoiceTax(invoiceId, taxId, companyId);
        return ResponseEntity.noContent().build();
    }
}
