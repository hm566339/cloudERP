package com.erp.crm.modules.communication.repository;

import com.erp.crm.modules.communication.entity.CrmMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmMessageRepository extends JpaRepository<CrmMessage, UUID> {
    List<CrmMessage> findByCompanyIdAndConversationIdOrderByCreatedAtAsc(UUID companyId, UUID conversationId);
    Page<CrmMessage> findByCompanyIdAndConversationId(UUID companyId, UUID conversationId, Pageable pageable);
}

