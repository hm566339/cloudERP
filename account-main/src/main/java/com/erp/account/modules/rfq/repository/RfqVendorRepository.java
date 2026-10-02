package com.erp.account.modules.rfq.repository;
import com.erp.account.modules.rfq.entity.RfqVendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface RfqVendorRepository extends JpaRepository<RfqVendor, UUID> { boolean existsByRfqIdAndVendorId(UUID rfqId, UUID vendorId); Optional<RfqVendor> findByRfqIdAndVendorId(UUID rfqId, UUID vendorId); }
