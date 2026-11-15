package com.erp.crm.modules.account.repository;

import com.erp.crm.modules.account.entity.CrmAccountContactRelation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmAccountContactRelationRepository extends JpaRepository<CrmAccountContactRelation, UUID> {
    List<CrmAccountContactRelation> findByCompanyIdAndAccountIdAndIsActiveTrue(UUID companyId, UUID accountId);
    List<CrmAccountContactRelation> findByCompanyIdAndContactIdAndIsActiveTrue(UUID companyId, UUID contactId);
    Optional<CrmAccountContactRelation> findByCompanyIdAndAccountIdAndContactId(UUID companyId, UUID accountId, UUID contactId);
}

