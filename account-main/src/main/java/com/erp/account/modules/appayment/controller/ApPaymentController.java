package com.erp.account.modules.appayment.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.appayment.dto.ApPaymentFilterDto;
import com.erp.account.modules.appayment.dto.ApPaymentRequest;
import com.erp.account.modules.appayment.dto.ApPaymentResponse;
import com.erp.account.modules.appayment.dto.PaymentLedgerResponse;
import com.erp.account.modules.appayment.service.ApPaymentService;
import com.erp.account.util.TenantUtils;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/account/ap-payments")
@AllArgsConstructor
public class ApPaymentController {

    private final ApPaymentService apPaymentService;

    @PostMapping
    public ResponseEntity<ApiResponse<ApPaymentResponse>> createPayment(
            @Valid @RequestBody RequestWrapper<ApPaymentRequest> requestWrapper, @RequestParam UUID companyId) {
        log.info("POST /api/account/ap-payments - create payment");
        ApPaymentResponse response = apPaymentService.createPayment(companyId, requestWrapper);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Payment created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ApPaymentResponse>> updatePayment(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ApPaymentRequest> requestWrapper) {
        log.info("PUT /api/account/ap-payments/{} - update payment", id);
        ApPaymentResponse response = apPaymentService.updatePayment(id, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> deletePayment(@PathVariable UUID id) {
        log.info("DELETE /api/account/ap-payments/{} - delete payment", id);
        apPaymentService.deletePayment(id);
        return ResponseEntity.ok(ApiResponse.success(
                PostResponse.builder().message("Payment deleted successfully").build(),
                "Payment deleted successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApPaymentResponse>> getPaymentById(@PathVariable UUID id) {
        log.info("GET /api/account/ap-payments/{} - get payment", id);
        ApPaymentResponse response = apPaymentService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ApPaymentResponse>>> getAllPayments(
            @ModelAttribute ApPaymentFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {

        log.info("GET /api/account/ap-payments - search payments with filters");

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, sortBy));

        Page<ApPaymentResponse> response = apPaymentService.getAllPayments(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Payments retrieved successfully"));
    }

    @PutMapping("/{id}/post")
    public ResponseEntity<ApiResponse<ApPaymentResponse>> postPayment(@PathVariable UUID id) {
        log.info("PUT /api/account/ap-payments/{}/post - post payment to GL", id);
        ApPaymentResponse response = apPaymentService.postPayment(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment posted successfully"));
    }

    @PutMapping("/{id}/reverse")
    public ResponseEntity<ApiResponse<ApPaymentResponse>> reversePayment(@PathVariable UUID id) {
        log.info("PUT /api/account/ap-payments/{}/reverse - reverse payment", id);
        ApPaymentResponse response = apPaymentService.reversePayment(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment reversed successfully"));
    }

    @GetMapping("/ledger/{vendorId}")
    public ResponseEntity<ApiResponse<PaymentLedgerResponse>> getPaymentLedger(
            @PathVariable UUID vendorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        log.info("GET /api/account/ap-payments/ledger/{} - get payment ledger", vendorId);
        PaymentLedgerResponse response = apPaymentService.getPaymentLedger(vendorId, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment ledger retrieved successfully"));
    }
}
