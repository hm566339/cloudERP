package com.erp.account.modules.vouchersequence.repository;

import com.erp.account.modules.vouchersequence.entity.VoucherSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoucherSequenceRepository extends JpaRepository<VoucherSequence, UUID> {

    Optional<VoucherSequence> findByCompanyIdAndVoucherTypeIgnoreCaseAndIsDeletedFalse(UUID companyId, String voucherType);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM VoucherSequence v WHERE v.company.id = :companyId AND v.voucherType = :voucherType AND (v.isDeleted = false OR v.isDeleted IS NULL)")
    Optional<VoucherSequence> findLockedByCompanyIdAndVoucherType(@Param("companyId") UUID companyId, @Param("voucherType") String voucherType);
}
