package com.erp.account.modules.accountgroup.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.accountgroup.entity.AccountGroup;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface AccountGroupRepository extends JpaRepository<AccountGroup, UUID>, JpaSpecificationExecutor<AccountGroup> {

        Optional<AccountGroup> findByCodeAndCompanyId(String code, UUID companyId);

        Optional<AccountGroup> findByCodeAndCompanyIdAndIsDeletedFalse(String code, UUID companyId);

        boolean existsByCodeAndCompanyId(String code, UUID companyId);

        boolean existsByCodeAndCompanyIdAndIsDeletedFalse(String code, UUID companyId);

        boolean existsByNameIgnoreCaseAndCompanyId(String name, UUID companyId);

        boolean existsByNameIgnoreCaseAndCompanyIdAndIsDeletedFalse(String name, UUID companyId);

        boolean existsByParentGroupIdAndIsDeletedFalse(UUID parentGroupId);

        boolean existsByParentGroupIdAndCompanyIdAndIsDeletedFalse(UUID parentGroupId, UUID companyId);

        Optional<AccountGroup> findByIdAndCompanyId(UUID id, UUID companyId);

        Optional<AccountGroup> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

        @Query("SELECT MAX(g.code) FROM AccountGroup g WHERE g.company.id = :companyId AND g.isDeleted = false")
        Optional<String> findMaxCodeByCompanyId(@Param("companyId") UUID companyId);
}
