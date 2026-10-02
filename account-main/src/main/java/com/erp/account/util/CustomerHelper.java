package com.erp.account.util;

import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.repository.CustomerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Component
public class CustomerHelper {

    private final CustomerRepository customerRepository;
    private final CustomerLedgerHelper customerLedgerHelper;

    public CustomerHelper(CustomerRepository customerRepository, CustomerLedgerHelper customerLedgerHelper) {
        this.customerRepository = customerRepository;
        this.customerLedgerHelper = customerLedgerHelper;
    }

    /**
     * Enrich customer response with calculated fields
     */
    public void enrichCustomerData(Customer customer) {
        log.debug("Enriching customer data for: {}", customer.getId());
        // This is handled in the service layer when building responses
    }

    /**
     * Validate customer can receive new invoice
     */
    public boolean canReceiveInvoice(Customer customer, BigDecimal invoiceAmount) {
        if (Boolean.FALSE.equals(customer.getIsActive())) {
            log.warn("Customer {} is inactive", customer.getId());
            return false;
        }
        if (Boolean.TRUE.equals(customer.getIsDeleted())) {
            log.warn("Customer {} is deleted", customer.getId());
            return false;
        }
        return !customerLedgerHelper.isCreditLimitExceeded(customer, invoiceAmount);
    }

    /**
     * Get customer total outstanding amount
     */
    public BigDecimal getOutstandingAmount(UUID customerId) {
        return customerRepository.getOutstandingAmount(customerId);
    }

    /**
     * Get customer available credit
     */
    public BigDecimal getAvailableCredit(UUID customerId) {
        Customer customer = customerRepository.findByIdAndIsDeletedFalse(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        return customerLedgerHelper.calculateAvailableCredit(customer);
    }
}
