package com.erp.account.util;

import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.entity.CustomerAddress;

public final class CustomerAddressUtils {

    private CustomerAddressUtils() {
    }

    public static CustomerAddress getDefaultAddress(Customer customer) {
        if (customer == null || customer.getAddresses() == null) {
            return null;
        }
        return customer.getAddresses().stream()
                .filter(address -> !Boolean.TRUE.equals(address.getIsDeleted()))
                .filter(address -> Boolean.TRUE.equals(address.getIsActive()))
                .filter(address -> Boolean.TRUE.equals(address.getIsDefault()))
                .findFirst()
                .orElseGet(() -> customer.getAddresses().stream()
                        .filter(address -> !Boolean.TRUE.equals(address.getIsDeleted()))
                        .filter(address -> Boolean.TRUE.equals(address.getIsActive()))
                        .findFirst()
                        .orElse(null));
    }

    public static String getAddressLine1(Customer customer) {
        CustomerAddress address = getDefaultAddress(customer);
        return address == null ? null : address.getAddressLine1();
    }

    public static String getCity(Customer customer) {
        CustomerAddress address = getDefaultAddress(customer);
        return address == null ? null : address.getCity();
    }

    public static String getState(Customer customer) {
        CustomerAddress address = getDefaultAddress(customer);
        return address == null || address.getGstState() == null ? null : address.getGstState().getStateName();
    }

    public static String getCountry(Customer customer) {
        CustomerAddress address = getDefaultAddress(customer);
        return address == null ? null : address.getCountry();
    }
}