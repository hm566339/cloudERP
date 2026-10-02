package com.erp.account.modules.appayment.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.appayment.dto.ApPaymentFilterDto;
import com.erp.account.modules.appayment.dto.ApPaymentRequest;
import com.erp.account.modules.appayment.dto.ApPaymentResponse;
import com.erp.account.modules.appayment.dto.PaymentLedgerResponse;
import com.erp.account.modules.appayment.entity.ApPayment;


public interface ApPaymentService {

    ApPaymentResponse createPayment(UUID companyId, RequestWrapper<ApPaymentRequest> requestWrapper);

    ApPaymentResponse updatePayment(UUID paymentId, RequestWrapper<ApPaymentRequest> requestWrapper);

    void deletePayment(UUID paymentId);

    ApPaymentResponse getPaymentById(UUID paymentId);

    ApPaymentResponse getPaymentByNumber(UUID companyId, String paymentNo);

    Page<ApPaymentResponse> getAllPayments(ApPaymentFilterDto filter, Pageable pageable);

    ApPaymentResponse postPayment(UUID paymentId);

    ApPaymentResponse reversePayment(UUID paymentId);

    PaymentLedgerResponse getPaymentLedger(UUID vendorId, LocalDate fromDate, LocalDate toDate);
}
