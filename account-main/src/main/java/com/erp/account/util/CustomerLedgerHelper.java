package com.erp.account.util;

import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.repository.CustomerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Component
public class CustomerLedgerHelper {

    private final CustomerRepository customerRepository;

    public CustomerLedgerHelper(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    /**
     * Calculate available credit for a customer
     * availableCredit = creditLimit - outstandingAmount
     */
    public BigDecimal calculateAvailableCredit(Customer customer) {
        if (customer.getCreditLimit() == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal outstanding = customerRepository.getOutstandingAmount(customer.getId());
        BigDecimal available = customer.getCreditLimit().subtract(outstanding);
        return available.max(BigDecimal.ZERO);
    }

    /**
     * Check if credit limit is exceeded
     */
    public boolean isCreditLimitExceeded(Customer customer, BigDecimal invoiceAmount) {
        if (customer.getCreditLimit() == null || invoiceAmount == null) {
            return false;
        }
        BigDecimal outstanding = customerRepository.getOutstandingAmount(customer.getId());
        BigDecimal totalWithNewInvoice = outstanding.add(invoiceAmount);
        return totalWithNewInvoice.compareTo(customer.getCreditLimit()) > 0;
    }

    /**
     * Get opening balance for a period
     */
    public BigDecimal getOpeningBalance(UUID customerId, LocalDate fromDate) {
        // Get all transactions before fromDate to calculate opening balance
        // This would need invoice data before the period
        log.debug("Calculating opening balance for customer: {} as of: {}", customerId, fromDate);
        return BigDecimal.ZERO; // Placeholder - would be implemented based on actual transactions
    }

    /**
     * Get closing balance for a period
     */
    public BigDecimal getClosingBalance(UUID customerId, LocalDate toDate) {
        return customerRepository.getOutstandingAmount(customerId);
    }
}
