package com.erp.account.modules.apinvoice.service;

import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import com.erp.account.util.InvoiceCalculationHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
public class InvoiceCalculationService {

    public BigDecimal calculateTotal(ApInvoiceRequest request) {
        return InvoiceCalculationHelper.calculateTotalAmount(
            request.getSubtotal(), request.getTaxAmount(), request.getTdsAmount(), request.getFreightCharges());
    }

    public BigDecimal calculateOutstanding(ApInvoiceRequest request, BigDecimal calculatedTotal) {
        BigDecimal paidAmount = request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO;
        return InvoiceCalculationHelper.calculateOutstandingAmount(calculatedTotal, paidAmount);
    }

    public void applyCalculatedAmounts(ApInvoiceRequest request) {
        BigDecimal calculatedTotal = calculateTotal(request);
        request.setTotalAmount(calculatedTotal);
        request.setOutstandingAmount(calculateOutstanding(request, calculatedTotal));
        log.debug("Calculated AP invoice total={} outstanding={}", calculatedTotal, request.getOutstandingAmount());
    }
}
