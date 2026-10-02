package com.erp.account.modules.appayment.service;

import com.erp.account.modules.appayment.dto.ApPaymentResponse;
import com.erp.account.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class VendorBalanceService {

    private final VendorRepository vendorRepository;

    public BigDecimal outstandingBalance(java.util.UUID vendorId, java.util.UUID companyId) {
        return vendorRepository.getOutstandingBalance(vendorId, companyId);
    }

    public ApPaymentResponse enrich(ApPaymentResponse response) {
        if (response != null && response.getVendorId() != null && response.getCompanyId() != null) {
            response.setVendorOutstandingBalance(outstandingBalance(response.getVendorId(), response.getCompanyId()));
        }
        return response;
    }
}
