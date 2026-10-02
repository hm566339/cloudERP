package com.erp.account.modules.ledger.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.ledger.entity.ChartOfAccount;

@Repository
public interface ChartOfAccountRepository extends JpaRepository<ChartOfAccount, UUID>, JpaSpecificationExecutor<ChartOfAccount> {

    /**
     * Lightweight (id, parentId) projection used to expand a parent account into all of its
     * descendant accounts (includeSubAccounts) without loading full entities.
     */
    interface IdParentProjection {
        UUID getId();

        UUID getParentId();
    }

    @Query("SELECT c.id AS id, c.parentAccount.id AS parentId FROM ChartOfAccount c "
            + "WHERE c.isDeleted = false AND (:companyId IS NULL OR c.company.id = :companyId)")
    List<IdParentProjection> findAllIdAndParentId(@Param("companyId") UUID companyId);

    Optional<ChartOfAccount> findByIdAndIsDeletedFalse(UUID id);

    Optional<ChartOfAccount> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    Optional<ChartOfAccount> findByCompanyIdAndAccountCodeAndIsDeletedFalse(UUID companyId, String accountCode);

    Optional<ChartOfAccount> findByCompanyIdAndAccountNameIgnoreCaseAndIsDeletedFalse(UUID companyId, String accountName);

    Page<ChartOfAccount> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    boolean existsByParentAccountIdAndIsDeletedFalse(UUID parentAccountId);

    boolean existsByParentAccountIdAndCompanyIdAndIsDeletedFalse(UUID parentAccountId, UUID companyId);

    boolean existsByGroupIdAndIsDeletedFalse(UUID groupId);

    boolean existsByGroupIdAndCompanyIdAndIsDeletedFalse(UUID groupId, UUID companyId);

    boolean existsByCompanyIdAndAccountCodeAndIsDeletedFalse(UUID companyId, String accountCode);

    @Query("SELECT MAX(c.accountCode) FROM ChartOfAccount c WHERE c.company.id = :companyId AND c.accountCode LIKE CONCAT(:prefix, '%') AND c.isDeleted = false")
    Optional<String> findMaxAccountCodeByPrefixAndCompanyId(@Param("prefix") String prefix, @Param("companyId") UUID companyId);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM gl_journal_line WHERE account_id = :accountId AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM budget_line WHERE account_id = :accountId AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM expense_category WHERE expense_account_id = :accountId AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM bank_account WHERE gl_account_id = :accountId AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM vendor WHERE payable_account_id = :accountId AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM payment_voucher WHERE (payable_account_id = :accountId OR payment_account_id = :accountId) AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM receipt_voucher WHERE (receivable_account_id = :accountId OR receipt_account_id = :accountId) AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM gl_balance_snapshot WHERE account_id = :accountId AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM ap_invoice_item WHERE expense_account_id = :accountId AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM ap_invoice WHERE (
                    input_cgst_account_id = :accountId OR input_sgst_account_id = :accountId OR input_igst_account_id = :accountId OR input_cess_account_id = :accountId
                ) AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM ar_invoice WHERE (
                    receivable_account_id = :accountId OR output_cgst_account_id = :accountId OR output_sgst_account_id = :accountId
                    OR output_igst_account_id = :accountId OR output_cess_account_id = :accountId
                ) AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM credit_note WHERE (
                    receivable_account_id = :accountId OR revenue_adjustment_account_id = :accountId
                ) AND COALESCE(is_deleted, false) = false
                UNION ALL SELECT 1 FROM debit_note WHERE (
                    payable_account_id = :accountId OR purchase_return_account_id = :accountId
                ) AND COALESCE(is_deleted, false) = false
            )
            """, nativeQuery = true)
    boolean existsAccountingReference(@Param("accountId") UUID accountId);
}
