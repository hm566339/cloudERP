package com.erp.account.util;

import com.erp.account.common.exception.CustomerInactiveException;
import com.erp.account.common.exception.CustomerDeletedException;
import com.erp.account.common.exception.DuplicateCustomerCodeException;
import com.erp.account.common.exception.CreditLimitExceededException;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.repository.CustomerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Component
public class CustomerValidationUtil {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]{10}$");

    private final CustomerRepository customerRepository;

    public CustomerValidationUtil(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    /**
     * Validate customer code for creation
     */
    public void validateCustomerCodeForCreation(String customerCode, UUID companyId) {
        if (customerCode == null || customerCode.trim().isEmpty()) {
            return;
        }

        String normalizedCode = customerCode.trim();
        if (normalizedCode.length() < 2 || normalizedCode.length() > 50) {
            throw new IllegalArgumentException("Customer code must be between 2 and 50 characters");
        }

        Optional<Customer> existing = customerRepository.findByCustomerCodeAndCompanyId(normalizedCode, companyId);
        if (existing.isPresent()) {
            log.warn("Duplicate customer code attempt: {} for company: {}", normalizedCode, companyId);
            throw new DuplicateCustomerCodeException(normalizedCode);
        }
    }

    /**
     * Validate customer code for update
     */
    public void validateCustomerCodeForUpdate(String customerCode, UUID companyId, UUID customerId) {
        if (customerCode == null || customerCode.trim().isEmpty()) {
            return;
        }

        String normalizedCode = customerCode.trim();
        if (normalizedCode.length() < 2 || normalizedCode.length() > 50) {
            throw new IllegalArgumentException("Customer code must be between 2 and 50 characters");
        }

        Optional<Customer> existing = customerRepository.findByCustomerCodeAndCompanyId(normalizedCode, companyId);
        if (existing.isPresent() && !existing.get().getId().equals(customerId)) {
            log.warn("Duplicate customer code attempt: {} for company: {}", normalizedCode, companyId);
            throw new DuplicateCustomerCodeException(normalizedCode);
        }
    }

    /**
     * Validate customer is not deleted
     */
    public void validateCustomerNotDeleted(Customer customer) {
        if (Boolean.TRUE.equals(customer.getIsDeleted())) {
            throw new CustomerDeletedException(customer.getCustomerName());
        }
    }

    /**
     * Validate customer is active
     */
    public void validateCustomerActive(Customer customer) {
        if (Boolean.FALSE.equals(customer.getIsActive())) {
            throw new CustomerInactiveException(customer.getCustomerName());
        }
    }

    /**
     * Validate customer format
     */
    public void validateCustomerFormat(String customerCode,
            String customerName,
            String email,
            String phone,
            BigDecimal creditLimit) {

        // Customer code is optional
        if (customerCode != null && !customerCode.trim().isEmpty()) {
            if (customerCode.length() < 2 || customerCode.length() > 50) {
                throw new IllegalArgumentException("Customer code must be between 2 and 50 characters");
            }
        }

        if (customerName == null || customerName.trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name cannot be empty");
        }

        if (customerName.length() < 2 || customerName.length() > 200) {
            throw new IllegalArgumentException("Customer name must be between 2 and 200 characters");
        }

        if (email != null && !email.trim().isEmpty()
                && !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Invalid email format: " + email);
        }

        if (phone != null && !phone.trim().isEmpty()
                && !PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException("Phone must be 10 digits");
        }

        if (creditLimit != null && creditLimit.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Credit limit cannot be negative");
        }
    }

    /**
     * Validate credit limit
     */
    public void validateCreditLimitNotExceeded(Customer customer, BigDecimal outstandingAmount) {
        if (customer.getCreditLimit() != null && outstandingAmount.compareTo(customer.getCreditLimit()) > 0) {
            throw new CreditLimitExceededException(customer.getCustomerName(), customer.getCreditLimit(),
                    outstandingAmount);
        }
    }
}
