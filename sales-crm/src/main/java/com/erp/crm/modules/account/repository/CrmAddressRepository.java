package com.erp.crm.modules.account.repository;

import com.erp.crm.modules.account.entity.CrmAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmAddressRepository extends JpaRepository<CrmAddress, UUID> {
    List<CrmAddress> findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalse(UUID companyId, String entityType, UUID entityId);
    Optional<CrmAddress> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
}

