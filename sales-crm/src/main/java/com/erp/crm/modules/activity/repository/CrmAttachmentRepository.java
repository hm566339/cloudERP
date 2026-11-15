package com.erp.crm.modules.activity.repository;

import com.erp.crm.modules.activity.entity.CrmAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmAttachmentRepository extends JpaRepository<CrmAttachment, UUID> {
    List<CrmAttachment> findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalse(UUID companyId, String entityType, UUID entityId);
    Optional<CrmAttachment> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
}

