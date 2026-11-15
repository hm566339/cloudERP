package com.erp.crm.modules.communication.repository;

import com.erp.crm.modules.communication.entity.CrmConversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmConversationRepository extends JpaRepository<CrmConversation, UUID> {
    List<CrmConversation> findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalseOrderByLastMessageAtDesc(UUID companyId, String entityType, UUID entityId);
    Page<CrmConversation> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
    Optional<CrmConversation> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
}

