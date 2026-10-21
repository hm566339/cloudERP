package com.erp.account.modules.vendor.service;

import com.erp.account.modules.vendor.dto.request.VendorRequest;
import com.erp.account.modules.vendor.dto.response.VendorResponse;
import com.erp.account.modules.vendor.dto.response.VendorProfileResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.ledger.dto.response.VendorLedgerResponse;
import com.erp.account.modules.vendor.dto.request.VendorFilterDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface VendorService {

    VendorResponse createVendor(UUID companyId, RequestWrapper<VendorRequest> request);

    VendorResponse createVendor(RequestWrapper<VendorRequest> request);

    VendorResponse updateVendor(UUID vendorId, RequestWrapper<VendorRequest> request);

    void deleteVendor(UUID vendorId);

    void activateVendor(UUID vendorId);

    void deactivateVendor(UUID vendorId);

    VendorProfileResponse getVendorById(UUID vendorId);

    List<com.erp.account.modules.vendor.dto.response.VendorAddressResponse> getVendorAddresses(UUID vendorId);

    VendorResponse getVendorByCode(String vendorCode);

    Page<VendorResponse> getAllVendors(VendorFilterDto filter, Pageable pageable);

    Page<VendorResponse> getAllVendors(VendorFilterDto filter, Pageable pageable, UUID companyId);

    List<VendorResponse> getActiveVendors();

    Page<VendorResponse> searchVendors(String query, Pageable pageable);

    Page<VendorResponse> searchVendorsByCity(String city, Pageable pageable);

    Page<VendorResponse> searchVendorsByState(String state, Pageable pageable);

    Page<VendorResponse> searchVendorsByCountry(String country, Pageable pageable);

    BigDecimal calculateOutstandingBalance(UUID vendorId);

    BigDecimal calculateAvailableCredit(UUID vendorId);

    boolean isCreditLimitExceeded(UUID vendorId, BigDecimal invoiceAmount);

    VendorLedgerResponse getVendorLedger(UUID vendorId, LocalDate fromDate, LocalDate toDate);

    VendorLedgerResponse getVendorTransactions(UUID vendorId, LocalDate fromDate, LocalDate toDate);

    VendorResponse getVendorByGstin(String gstin);

    VendorResponse getVendorByPan(String pan);

    void validateVendor(VendorRequest request);
}
