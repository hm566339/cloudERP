package com.erp.account.modules.vendor.repository;

import com.erp.account.modules.vendor.entity.VendorAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorAddressRepository extends JpaRepository<VendorAddress, UUID> {
    
    List<VendorAddress> findByVendorIdAndIsDeletedFalse(UUID vendorId);
    
    Optional<VendorAddress> findByIdAndVendorIdAndIsDeletedFalse(UUID id, UUID vendorId);
}
