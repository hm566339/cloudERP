package com.erp.workflow.repository;

import com.erp.workflow.entity.WorkflowNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WorkflowNotificationRepository extends JpaRepository<WorkflowNotification, UUID> {

    Page<WorkflowNotification> findByCompanyIdAndRecipientUserIdOrderByCreatedAtDesc(
            UUID companyId, UUID recipientUserId, Pageable pageable);

    Page<WorkflowNotification> findByCompanyIdAndRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(
            UUID companyId, UUID recipientUserId, Pageable pageable);

    long countByCompanyIdAndRecipientUserIdAndIsReadFalse(UUID companyId, UUID recipientUserId);
}
