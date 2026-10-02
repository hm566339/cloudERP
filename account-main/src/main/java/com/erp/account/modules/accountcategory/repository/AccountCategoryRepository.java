package com.erp.account.modules.accountcategory.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.accountcategory.entity.AccountCategory;

import org.springframework.data.repository.query.Param;

@Repository
public interface AccountCategoryRepository extends JpaRepository<AccountCategory, UUID>, JpaSpecificationExecutor<AccountCategory> {

    Optional<AccountCategory> findByCode(String code);

    Optional<AccountCategory> findByCodeAndCompanyId(String code, UUID companyId);

    Optional<AccountCategory> findByNameIgnoreCaseAndCompanyId(String name, UUID companyId);

    boolean existsByCode(String code);

    boolean existsByCodeAndCompanyId(String code, UUID companyId);

    boolean existsByNameIgnoreCaseAndCompanyId(String name, UUID companyId);

    Optional<AccountCategory> findByIdAndCompanyId(UUID id, UUID companyId);

    Optional<AccountCategory> findByIdAndCompanyIdAndIsDeleted(UUID id, UUID companyId, Boolean isDeleted);

    @Query("SELECT MAX(c.code) FROM AccountCategory c WHERE c.company.id = :companyId AND c.isDeleted = false")
    Optional<String> findMaxCodeByCompanyId(@Param("companyId") UUID companyId);
}
