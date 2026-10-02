package com.erp.account.modules.customer.repository;

import com.erp.account.modules.customer.entity.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, UUID> {
    List<CustomerAddress> findByCustomerIdAndIsDeletedFalse(UUID customerId);
    List<CustomerAddress> findByCustomerIdAndIsActiveTrueAndIsDeletedFalse(UUID customerId);
    Optional<CustomerAddress> findByIdAndCustomerIdAndIsDeletedFalse(UUID id, UUID customerId);
    Optional<CustomerAddress> findByCustomerIdAndIsDefaultTrueAndIsDeletedFalse(UUID customerId);
}
