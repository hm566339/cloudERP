package com.erp.communication.notification.repository;

import com.erp.communication.notification.entity.UserNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, UUID> {

    Page<UserNotification> findByTenantIdAndRecipientUserIdOrderByCreatedAtDesc(
            UUID tenantId, UUID recipientUserId, Pageable pageable);

    Page<UserNotification> findByTenantIdAndRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(
            UUID tenantId, UUID recipientUserId, Pageable pageable);

    long countByTenantIdAndRecipientUserIdAndIsReadFalse(UUID tenantId, UUID recipientUserId);

    Optional<UserNotification> findByIdAndTenantIdAndRecipientUserId(
            UUID id, UUID tenantId, UUID recipientUserId);

    @Modifying
    @Query("UPDATE UserNotification n SET n.isRead = true WHERE n.tenantId = :tenantId AND n.recipientUserId = :recipientUserId AND n.isRead = false")
    int markAllAsRead(@Param("tenantId") UUID tenantId, @Param("recipientUserId") UUID recipientUserId);
}
