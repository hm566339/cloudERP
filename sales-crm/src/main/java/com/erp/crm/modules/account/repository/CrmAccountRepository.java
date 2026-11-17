package com.erp.crm.modules.account.repository;

import com.erp.crm.modules.account.entity.CrmAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmAccountRepository extends JpaRepository<CrmAccount, UUID>, JpaSpecificationExecutor<CrmAccount> {

    Optional<CrmAccount> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);

    Optional<CrmAccount> findByCompanyIdAndAccountCodeAndIsDeletedFalse(UUID companyId, String accountCode);

    Page<CrmAccount> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    long countByCompanyIdAndIsDeletedFalse(UUID companyId);

    List<CrmAccount> findByCompanyIdAndAccountNameContainingIgnoreCaseAndIsDeletedFalse(UUID companyId, String name);
}

