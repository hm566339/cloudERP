package com.erp.crm.modules.account.repository;

import com.erp.crm.modules.account.entity.CrmContact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmContactRepository extends JpaRepository<CrmContact, UUID>, JpaSpecificationExecutor<CrmContact> {

    Optional<CrmContact> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);

    Optional<CrmContact> findByCompanyIdAndContactCodeAndIsDeletedFalse(UUID companyId, String contactCode);

    List<CrmContact> findByCompanyIdAndAccountIdAndIsDeletedFalse(UUID companyId, UUID accountId);

    Page<CrmContact> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
}

