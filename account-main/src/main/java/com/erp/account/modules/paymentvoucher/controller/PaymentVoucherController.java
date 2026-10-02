package com.erp.account.modules.paymentvoucher.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherFilterDto;
import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherRequest;
import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse;
import com.erp.account.modules.paymentvoucher.dto.response.profile.PaymentVoucherProfileResponse;
import com.erp.account.modules.paymentvoucher.service.PaymentVoucherService;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import com.erp.account.security.annotation.RequireFeature;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/api/account/payment-vouchers")
@RequiredArgsConstructor
@RequireFeature("PAYMENTS")
public class PaymentVoucherController {

    private final PaymentVoucherService paymentVoucherService;

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentVoucherResponse>> createPaymentVoucher(
            @Valid @RequestBody RequestWrapper<PaymentVoucherRequest> requestWrapper, @RequestParam(required = false) UUID companyId) {
        PaymentVoucherRequest request = requestWrapper.unwrap();
        PaymentVoucherResponse response = paymentVoucherService.createPaymentVoucher(companyId, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment voucher created successfully"));
    }

    @PutMapping("/{voucherId}")
    public ResponseEntity<ApiResponse<PaymentVoucherResponse>> updatePaymentVoucher(
            @PathVariable UUID voucherId,
            @Valid @RequestBody RequestWrapper<PaymentVoucherRequest> requestWrapper) {
        PaymentVoucherRequest request = requestWrapper.unwrap();
        PaymentVoucherResponse response = paymentVoucherService.updatePaymentVoucher(voucherId, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment voucher updated successfully"));
    }

    @DeleteMapping("/{voucherId}")
    public ResponseEntity<ApiResponse<Void>> deletePaymentVoucher(@PathVariable UUID voucherId) {
        paymentVoucherService.deletePaymentVoucher(voucherId);
        return ResponseEntity.ok(ApiResponse.success(null, "Payment voucher deleted successfully"));
    }

    @GetMapping("/{voucherId}")
    public ResponseEntity<ApiResponse<PaymentVoucherProfileResponse>> getPaymentVoucherById(
            @PathVariable UUID voucherId) {
        PaymentVoucherProfileResponse response = paymentVoucherService.getPaymentVoucherById(voucherId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment voucher retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentVoucherResponse>>> getAllPaymentVouchers(
            @ModelAttribute PaymentVoucherFilterDto filter,
            Pageable pageable) {
        Page<PaymentVoucherResponse> page = paymentVoucherService.getAllPaymentVouchers(filter, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Payment vouchers retrieved successfully"));
    }

    @PostMapping("/{voucherId}/approve")
    public ResponseEntity<ApiResponse<PaymentVoucherResponse>> approvePaymentVoucher(@PathVariable UUID voucherId) {
        PaymentVoucherResponse response = paymentVoucherService.approvePaymentVoucher(voucherId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment voucher approved successfully"));
    }

    @PostMapping("/{voucherId}/submit")
    public ResponseEntity<ApiResponse<PaymentVoucherResponse>> submitForApproval(@PathVariable UUID voucherId) {
        PaymentVoucherResponse response = paymentVoucherService.submitForApproval(voucherId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment voucher submitted successfully"));
    }

    @PostMapping("/{voucherId}/reject")
    public ResponseEntity<ApiResponse<PaymentVoucherResponse>> rejectPaymentVoucher(@PathVariable UUID voucherId) {
        PaymentVoucherResponse response = paymentVoucherService.rejectPaymentVoucher(voucherId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment voucher rejected successfully"));
    }

    @PostMapping("/{voucherId}/post")
    public ResponseEntity<ApiResponse<PaymentVoucherResponse>> postPaymentVoucher(@PathVariable UUID voucherId) {
        PaymentVoucherResponse response = paymentVoucherService.postPaymentVoucher(voucherId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment voucher posted successfully"));
    }

    @PostMapping("/{voucherId}/reverse")
    public ResponseEntity<ApiResponse<PaymentVoucherResponse>> reversePaymentVoucher(@PathVariable UUID voucherId) {
        PaymentVoucherResponse response = paymentVoucherService.reversePaymentVoucher(voucherId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment voucher reversed successfully"));
    }

    @PostMapping("/{voucherId}/cancel")
    public ResponseEntity<ApiResponse<PaymentVoucherResponse>> cancelPaymentVoucher(@PathVariable UUID voucherId) {
        PaymentVoucherResponse response = paymentVoucherService.cancelPaymentVoucher(voucherId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment voucher cancelled successfully"));
    }
}
