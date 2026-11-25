package com.erp.communication.repository;

import com.erp.communication.entity.NotificationDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationDeliveryRepository extends JpaRepository<NotificationDelivery, UUID> {

    List<NotificationDelivery> findByNotificationRequestIdOrderByAttemptNumberAsc(UUID notificationId);

    Optional<NotificationDelivery> findFirstByProviderMessageIdOrderByAttemptAtDesc(String providerMessageId);

    List<NotificationDelivery> findByProviderMessageId(String providerMessageId);
}
