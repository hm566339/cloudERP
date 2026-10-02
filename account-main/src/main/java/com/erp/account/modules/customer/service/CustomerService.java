package com.erp.account.modules.customer.service;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.customer.dto.request.CustomerFilterDto;
import com.erp.account.modules.customer.dto.request.CustomerRequest;
import com.erp.account.modules.customer.dto.response.CustomerResponse;
import com.erp.account.modules.customer.dto.response.CustomerProfileResponse;
import com.erp.account.modules.ledger.dto.response.CustomerLedgerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface CustomerService {

    CustomerResponse createCustomer(RequestWrapper<CustomerRequest> request, UUID companyId);

    CustomerResponse updateCustomer(UUID customerId, RequestWrapper<CustomerRequest> request);

    void deleteCustomer(UUID customerId);

    void activateCustomer(UUID customerId);

    void deactivateCustomer(UUID customerId);

    CustomerProfileResponse getCustomerById(UUID customerId);

    CustomerResponse getCustomerByCode(String customerCode);

    Page<CustomerResponse> getAllCustomers(CustomerFilterDto filter, Pageable pageable);

    void validateCustomer(CustomerRequest request);

    CustomerLedgerResponse getCustomerLedger(UUID customerId, LocalDate fromDate, LocalDate toDate);

    CustomerLedgerResponse getCustomerTransactions(UUID customerId, LocalDate fromDate, LocalDate toDate);

    CustomerResponse getCustomerByGstin(String gstin);

    CustomerResponse getCustomerByPan(String pan);
}
