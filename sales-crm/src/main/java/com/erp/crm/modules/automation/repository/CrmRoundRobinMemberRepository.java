package com.erp.crm.modules.automation.repository;

import com.erp.crm.modules.automation.entity.CrmRoundRobinMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmRoundRobinMemberRepository extends JpaRepository<CrmRoundRobinMember, UUID> {
    List<CrmRoundRobinMember> findByCompanyIdAndPoolIdAndIsActiveTrueAndIsDeletedFalse(UUID companyId, UUID poolId);
    Optional<CrmRoundRobinMember> findByPoolIdAndUserIdAndIsDeletedFalse(UUID poolId, UUID userId);
}

