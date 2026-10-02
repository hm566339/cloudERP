package com.erp.account.modules.bankaccount.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.erp.account.modules.bankaccount.entity.BankAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.erp.account.enums.BankAccountType;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, UUID>, JpaSpecificationExecutor<BankAccount> {

    Optional<BankAccount> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    Optional<BankAccount> findByCompanyIdAndAccountNumberAndIsDeletedFalse(UUID companyId, String accountNumber);

    boolean existsByCompanyIdAndAccountNumberAndIsDeletedFalse(UUID companyId, String accountNumber);

    Page<BankAccount> findAllByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    Page<BankAccount> findAllByCompanyIdAndIsActiveTrueAndIsDeletedFalse(UUID companyId, Pageable pageable);

    List<BankAccount> findByCompanyIdAndIsDeletedFalse(UUID companyId);

    Optional<BankAccount> findByIdAndIsDeletedFalse(UUID bankAccountId);

    @Query("SELECT b FROM BankAccount b " +
           "LEFT JOIN FETCH b.company " +
           "LEFT JOIN FETCH b.glAccount " +
           "WHERE b.id = :id AND b.isDeleted = false")
    Optional<BankAccount> findProfileById(@Param("id") UUID id);

    Optional<BankAccount> findByCompanyIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse(UUID companyId);

    List<BankAccount> findByCompanyIdAndIsActiveTrueAndIsDeletedFalse(UUID companyId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE BankAccount b SET b.isPrimary = false WHERE b.company.id = :companyId AND b.isDeleted = false")
    void unsetPrimaryForCompany(@Param("companyId") UUID companyId);
}
