package com.erp.account.modules.paymentvoucher.service;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherFilterDto;
import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherRequest;
import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse;
import com.erp.account.modules.paymentvoucher.dto.response.profile.PaymentVoucherProfileResponse;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public interface PaymentVoucherService {
    PaymentVoucherResponse createPaymentVoucher(UUID companyId, RequestWrapper<PaymentVoucherRequest> request);
    PaymentVoucherResponse updatePaymentVoucher(UUID voucherId, RequestWrapper<PaymentVoucherRequest> request);
    void deletePaymentVoucher(UUID voucherId);
    PaymentVoucherProfileResponse getPaymentVoucherById(UUID voucherId);
    PaymentVoucherResponse getPaymentVoucherByNumber(UUID companyId, String voucherNo);
    Page<PaymentVoucherResponse> getAllPaymentVouchers(PaymentVoucherFilterDto filter, Pageable pageable);
    PaymentVoucherResponse submitForApproval(UUID voucherId);
    PaymentVoucherResponse rejectPaymentVoucher(UUID voucherId);
    PaymentVoucherResponse approvePaymentVoucher(UUID voucherId);
    PaymentVoucherResponse postPaymentVoucher(UUID voucherId);
    PaymentVoucherResponse postPaymentVoucherDirectly(UUID voucherId);
    PaymentVoucherResponse postPaymentVoucherDirectly(PaymentVoucher voucher);
    PaymentVoucherResponse reversePaymentVoucher(UUID voucherId);
    PaymentVoucherResponse cancelPaymentVoucher(UUID voucherId);
}
